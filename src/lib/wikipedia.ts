const WIKI_API_URL = 'https://ja.wikipedia.org/w/api.php';

export interface WikiPage {
  title: string;
  extract?: string;
  pageid: number;
}

export const CATEGORIES = [
  { id: 'random', label: 'ランダム', category: null },
  { id: 'food', label: '食べ物', category: [
    'Category:日本の料理', 'Category:各国の料理', 'Category:菓子', 
    'Category:果物', 'Category:野菜', 'Category:魚料理', 'Category:肉料理'
  ] },
  { id: 'animals', label: '動物', category: 'Category:動物' },
  { id: 'geography', label: '地理', category: 'Category:地理' },
  { id: 'history', label: '歴史', category: 'Category:歴史' },
  { id: 'anime', label: 'アニメ', category: 'Category:アニメ作品' },
] as const;

export async function getRandomArticles(count: number = 2): Promise<string[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'random',
    rnnamespace: '0', // Only main articles
    rnlimit: count.toString(),
    origin: '*',
  });

  const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
  const data = await response.json();
  
  if (data.query && data.query.random) {
    return data.query.random.map((p: any) => p.title);
  }
  throw new Error('Failed to fetch random articles');
}

export async function getRandomArticleFromCategory(category: string | readonly string[]): Promise<string> {
  const targetCategory = Array.isArray(category) 
    ? category[Math.floor(Math.random() * category.length)] 
    : category as string;

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'categorymembers',
    cmtitle: targetCategory,
    cmnamespace: '0',
    cmlimit: '200',
    origin: '*',
  });

  const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
  const data = await response.json();

  if (data.query && data.query.categorymembers && data.query.categorymembers.length > 0) {
    let members = data.query.categorymembers;
    
    // Filter out meta-articles, lists, and general terms
    const filterWords = ['一覧', 'カテゴリ', '歴史', '文化', '学', '用語', '食品', '料理', 'の概要', '統計'];
    const filteredMembers = members.filter((m: any) => {
      const title = m.title;
      return !filterWords.some(word => title.includes(word)) && title.length > 1;
    });

    const pool = filteredMembers.length > 0 ? filteredMembers : members;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex].title;
  }
  
  // Fallback to completely random if category fetch fails or is empty
  const [randomTitle] = await getRandomArticles(1);
  return randomTitle;
}

export async function getBacklinks(title: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'backlinks',
    bltitle: title,
    blnamespace: '0',
    bllimit: '500',
    origin: '*',
  });

  const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
  const data = await response.json();

  if (data.query && data.query.backlinks) {
    return data.query.backlinks.map((b: any) => b.title);
  }
  return [];
}

export async function getForwardLinks(title: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'links',
    titles: title,
    plnamespace: '0',
    pllimit: '500',
    origin: '*',
  });

  const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
  const data = await response.json();

  if (data.query && data.query.pages) {
    const pageId = Object.keys(data.query.pages)[0];
    const links = data.query.pages[pageId].links;
    if (links) {
      return links.map((l: any) => l.title);
    }
  }
  return [];
}

export async function findSimplePath(start: string, goal: string): Promise<string[]> {
  try {
    // 1. Level 1: Direct link (A -> B)
    const startLinks = await getForwardLinks(start);
    if (startLinks.includes(goal)) {
      return [start, goal];
    }

    // 2. Level 2: Bidirectional search (A -> M1 -> B)
    const goalBacklinks = await getBacklinks(goal);
    const intersection2 = startLinks.filter(title => goalBacklinks.includes(title));
    if (intersection2.length > 0) {
      const mid = intersection2.find(t => !t.includes(':')) || intersection2[0];
      return [start, mid, goal];
    }

    // 3. Level 3: Expand forward (A -> M1 -> M2 -> B)
    // Try top candidates from start links
    const forwardCandidates = startLinks.slice(0, 15).filter(t => !t.includes(':'));
    for (const m1 of forwardCandidates) {
      const m1Links = await getForwardLinks(m1);
      const intersection3 = m1Links.filter(title => goalBacklinks.includes(title));
      if (intersection3.length > 0) {
        return [start, m1, intersection3[0], goal];
      }
    }

    // 4. Level 4: Expand backward (A -> M1 -> M2 -> M3 -> B)
    // Try top candidates from goal backlinks
    const backwardCandidates = goalBacklinks.slice(0, 15).filter(t => !t.includes(':'));
    for (const m3 of backwardCandidates) {
      const m3Backlinks = await getBacklinks(m3);
      // Check if any m3Backlinks are in Pool 1 or Pool 2
      for (const m1 of forwardCandidates) {
        const m1Links = await getForwardLinks(m1);
        const intersection4 = m1Links.filter(title => m3Backlinks.includes(title));
        if (intersection4.length > 0) {
          return [start, m1, intersection4[0], m3, goal];
        }
      }
    }

    // Fallback: If still nothing, just return what we have instead of '...'
    if (goalBacklinks.length > 0) {
      return [start, forwardCandidates[0] || '...', goalBacklinks[0], goal];
    }

    return [start, goal];
  } catch (error) {
    console.error('Path finding failed', error);
    return [start, goal];
  }
}

export async function getArticleContent(title: string): Promise<string> {
  const params = new URLSearchParams({
    action: 'parse',
    format: 'json',
    page: title,
    prop: 'text',
    mobileformat: '1',
    origin: '*',
    disableeditsection: '1',
    noimages: '1', // Optional: faster load
  });

  const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
  const data = await response.json();

  if (data.parse && data.parse.text) {
    return data.parse.text['*'];
  }
  throw new Error(`Failed to fetch content for: ${title}`);
}

export async function getArticleSummary(title: string): Promise<string> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'extracts',
    exintro: '1',
    explaintext: '1',
    exsentences: '2', // Get only 2 sentences for a brief summary
    titles: title,
    origin: '*',
  });

  const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
  const data = await response.json();

  if (data.query && data.query.pages) {
    const pageId = Object.keys(data.query.pages)[0];
    return data.query.pages[pageId].extract || '概要はありません。';
  }
  return '概要を取得できませんでした。';
}

export function cleanWikiHtml(html: string): string {
  // Use DOMParser if in browser, otherwise just string manipulation
  if (typeof window === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove unwanted elements
  const selectorsToRemove = [
    '.mw-editsection',
    '.infobox',
    '.navbox',
    '.metadata',
    '.ambox',
    '.asbox',
    '.reflist',
    '.reference',
    '.hatnote',
    '.sidebar',
    'table.vertical-navbox',
    '#toc',
    '.toc',
  ];

  selectorsToRemove.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Rewrite links
  doc.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    
    // Only keep internal Wikipedia links
    if (href && href.startsWith('/wiki/') && !href.includes(':')) {
      const title = decodeURIComponent(href.replace('/wiki/', ''));
      a.setAttribute('data-wiki-title', title);
      a.setAttribute('href', '#');
      a.classList.add('wiki-link');
    } else {
      // Disable other links
      a.removeAttribute('href');
      a.style.textDecoration = 'none';
      a.style.color = 'inherit';
      a.style.cursor = 'default';
    }
  });

  return doc.body.innerHTML;
}
