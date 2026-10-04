function tokenize(text = '') {
  return new Set(
    String(text)
      .toLowerCase()
      .normalize('NFKC')
      .replace(/[^\p{L}\p{N}#@]+/gu, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2)
  );
}

function jaccard(a, b) {
  if (!a.size && !b.size) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function parseTime(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function timeDeltaSeconds(a, b) {
  const first = parseTime(a);
  const second = parseTime(b);
  if (first === null || second === null) return null;
  const raw = Math.abs(first - second);
  return Math.min(raw, 86400 - raw);
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value))).map(Number);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function analysisOf(post) {
  return post.analysis || {};
}

function meaningfulNarrative(value) {
  const narrative = String(value || '').trim();
  return narrative && !['Pending Analysis', 'General discussion'].includes(narrative);
}

function relationForPosts(a, b) {
  const analysisA = analysisOf(a);
  const analysisB = analysisOf(b);
  const similarity = jaccard(tokenize(a.text), tokenize(b.text));
  const narrative = meaningfulNarrative(analysisA.narrative) ? analysisA.narrative : null;
  const narrativeMatch = Boolean(narrative && narrative === analysisB.narrative);
  const deltaSeconds = timeDeltaSeconds(a.timestamp, b.timestamp);
  const synchronized = deltaSeconds !== null && deltaSeconds <= 120;
  const coordinationWindow = deltaSeconds !== null && deltaSeconds <= 300;
  const relatedWindow = deltaSeconds === null || deltaSeconds <= 900;

  const urgency = Math.max(clamp01(analysisA.urgency), clamp01(analysisB.urgency));
  const manipulation = Math.max(clamp01(analysisA.manipulation), clamp01(analysisB.manipulation));
  const claimSignal = Math.max(clamp01(analysisA.claimSignal), clamp01(analysisB.claimSignal));
  const threatCue = Math.max(urgency, manipulation, claimSignal);

  // Verification/counter-signal narratives should be connected for context, but
  // are not treated as suspicious coordination unless their text is near-duplicate.
  const verificationNarrative = narrative === 'Verification response';

  const suspicious =
    (!verificationNarrative && narrativeMatch && coordinationWindow && (similarity >= 0.08 || threatCue >= 0.25)) ||
    (similarity >= 0.45 && coordinationWindow);

  const related =
    suspicious ||
    similarity >= 0.18 ||
    (narrativeMatch && relatedWindow);

  if (!related) return null;

  let weight = similarity * 0.40;
  if (narrativeMatch) weight += 0.35;
  if (synchronized) weight += 0.15;
  else if (coordinationWindow) weight += 0.08;
  weight += threatCue * 0.10;

  return {
    suspicious,
    similarity: Number(similarity.toFixed(3)),
    narrativeMatch,
    narrative,
    synchronized,
    deltaSeconds,
    threatCue: Number(threatCue.toFixed(3)),
    weight: Number(Math.min(1, weight).toFixed(3))
  };
}

function assignCommunities(handles, suspiciousEdges) {
  const adjacency = new Map(handles.map((handle) => [handle, new Set()]));
  for (const edge of suspiciousEdges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const visited = new Set();
  const communities = new Map();
  let clusterNumber = 1;

  for (const handle of handles) {
    if (visited.has(handle)) continue;

    const component = [];
    const stack = [handle];
    visited.add(handle);

    while (stack.length) {
      const current = stack.pop();
      component.push(current);
      for (const neighbor of adjacency.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }

    if (component.length >= 2) {
      const cluster = `C-${String(clusterNumber).padStart(2, '0')}`;
      clusterNumber += 1;
      for (const member of component) communities.set(member, cluster);
    } else {
      communities.set(component[0], 'C-SOLO');
    }
  }

  return communities;
}

export function buildNetwork(posts = []) {
  const analyzedPosts = posts.filter((post) => post.analysis);
  const accountMap = new Map();

  for (const post of analyzedPosts) {
    const handle = post.handle || '@unknown';
    if (!accountMap.has(handle)) accountMap.set(handle, []);
    accountMap.get(handle).push(post);
  }

  const handles = [...accountMap.keys()];
  const edgeMap = new Map();

  for (let i = 0; i < analyzedPosts.length; i += 1) {
    for (let j = i + 1; j < analyzedPosts.length; j += 1) {
      const a = analyzedPosts[i];
      const b = analyzedPosts[j];
      if (a.handle === b.handle) continue;

      const relation = relationForPosts(a, b);
      if (!relation) continue;

      const pair = [a.handle, b.handle].sort();
      const key = pair.join('|');
      const existing = edgeMap.get(key);

      if (!existing || relation.weight > existing.weight) {
        edgeMap.set(key, {
          source: pair[0],
          target: pair[1],
          ...relation
        });
      }
    }
  }

  const edges = [...edgeMap.values()];
  const suspiciousEdges = edges.filter((edge) => edge.suspicious);
  const communities = assignCommunities(handles, suspiciousEdges);

  const nodes = handles.map((handle) => {
    const accountPosts = accountMap.get(handle);
    const incident = edges.filter((edge) => edge.source === handle || edge.target === handle);
    const suspiciousIncident = incident.filter((edge) => edge.suspicious);
    const degreeCentrality = handles.length > 1 ? incident.length / (handles.length - 1) : 0;
    const syncRatio = incident.length ? suspiciousIncident.length / incident.length : 0;
    const avgUrgency = average(accountPosts.map((post) => analysisOf(post).urgency));
    const avgManipulation = average(accountPosts.map((post) => analysisOf(post).manipulation));
    const repeatedPosting = Math.min(1, Math.max(0, accountPosts.length - 1) / 4);

    const bot = clamp01(
      (syncRatio * 0.45) +
      (avgUrgency * 0.20) +
      (avgManipulation * 0.20) +
      (repeatedPosting * 0.15)
    );

    const centrality = clamp01(
      (degreeCentrality * 0.75) +
      (Math.min(1, suspiciousIncident.length / 4) * 0.25)
    );

    const type = centrality >= 0.40
      ? 'hub'
      : bot >= 0.65
        ? 'bot'
        : 'human';

    return {
      id: handle,
      label: handle,
      type,
      bot: Number(bot.toFixed(3)),
      centrality: Number(centrality.toFixed(3)),
      cluster: communities.get(handle) || 'C-SOLO',
      synced: suspiciousIncident.length,
      posts: accountPosts.length
    };
  });

  return {
    nodes,
    edges,
    stats: {
      accounts: nodes.length,
      relationships: edges.length,
      suspiciousRelationships: suspiciousEdges.length,
      suspiciousClusters: [...new Set(nodes.filter((node) => node.cluster !== 'C-SOLO').map((node) => node.cluster))].length
    }
  };
}
