export default async function handler(req, res) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "MISSING_TOKEN", message: "Please set GITHUB_TOKEN in Vercel settings" });
  }

  // --- 1. Original GitHub-Readme-Stats Logic Constants ---
  // මේවා තමයි Official Repo එකේ පාවිච්චි කරන "Mean Values" (සාමාන්‍ය අගයන්)
  const COMMITS_MEDIAN = 1000;
  const COMMITS_WEIGHT = 2;
  
  const PRS_MEDIAN = 50;
  const PRS_WEIGHT = 3;
  
  const ISSUES_MEDIAN = 25;
  const ISSUES_WEIGHT = 1;
  
  const STARS_MEDIAN = 50;
  const STARS_WEIGHT = 4;
  
  const FOLLOWERS_MEDIAN = 10;
  const FOLLOWERS_WEIGHT = 1;

  // Reviews ගණන් ගන්නේ නැති වුනොත් අවුලක් නෑ (API එකෙන් සමහර විට එන්නේ නෑ)
  const TOTAL_WEIGHT = COMMITS_WEIGHT + PRS_WEIGHT + ISSUES_WEIGHT + STARS_WEIGHT + FOLLOWERS_WEIGHT;

  // --- Helper: Exponential CDF Function ---
  // මේකෙන් තමයි ලකුණු 0-100 අතරට හදන්නේ (Diminishing Returns)
  // උදාහරණ: Commits 1000 ක් තියෙන කෙනාට 50% ක් හම්බෙනවා. 5000ක් තිබ්බත් 100% වෙන්නේ නෑ.
  const calculateScore = (value, median) => {
    return 1 - Math.pow(0.5, value / median);
  };

  const query = `
    query {
      viewer {
        login
        name
        followers {
          totalCount
        }
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          restrictedContributionsCount
        }
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
          totalCount
          nodes {
            stargazerCount
            forkCount
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  color
                  name
                }
              }
            }
          }
        }
        collaborations: repositories(ownerAffiliations: COLLABORATOR) {
          totalCount
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error(data.errors);
      return res.status(500).json({ error: "GITHUB_API_ERROR", details: data.errors });
    }

    if (!data.data || !data.data.viewer) {
      return res.status(500).json({ error: "NO_DATA", message: "User data not found" });
    }

    const viewer = data.data.viewer;
    const contribs = viewer.contributionsCollection;
    const repos = viewer.repositories.nodes;

    // --- Data Aggregation ---
    let totalStars = 0;
    let totalForks = 0;
    let languageStats = {};
    let totalSize = 0;

    repos.forEach(repo => {
      totalStars += repo.stargazerCount;
      totalForks += repo.forkCount;
      if (repo.languages && repo.languages.edges) {
        repo.languages.edges.forEach(edge => {
          const { size, node } = edge;
          if (!languageStats[node.name]) {
            languageStats[node.name] = { size: 0, color: node.color };
          }
          languageStats[node.name].size += size;
          totalSize += size;
        });
      }
    });

    const totalCommits = contribs.totalCommitContributions + (contribs.restrictedContributionsCount || 0);
    const totalPRs = contribs.totalPullRequestContributions;
    const totalIssues = contribs.totalIssueContributions;
    const totalRepos = viewer.repositories.totalCount;
    const totalCollabs = viewer.collaborations ? viewer.collaborations.totalCount : 0;
    const followers = viewer.followers.totalCount;

    // --- 2. Real Rank Calculation (The Hard Mode) ---
    
    // Calculate individual scores (0 to 1)
    const commitScore = calculateScore(totalCommits, COMMITS_MEDIAN);
    const prScore = calculateScore(totalPRs, PRS_MEDIAN);
    const issueScore = calculateScore(totalIssues, ISSUES_MEDIAN);
    const starScore = calculateScore(totalStars, STARS_MEDIAN);
    const followerScore = calculateScore(followers, FOLLOWERS_MEDIAN);

    // Calculate Weighted Average
    const weightedSum = 
      (commitScore * COMMITS_WEIGHT) +
      (prScore * PRS_WEIGHT) +
      (issueScore * ISSUES_WEIGHT) +
      (starScore * STARS_WEIGHT) +
      (followerScore * FOLLOWERS_WEIGHT);

    const totalScore = (weightedSum / TOTAL_WEIGHT) * 100;

    // Determine Rank based on Percentile
    let rank = 'C';
    if (totalScore >= 95) rank = 'S+'; // Top 5%
    else if (totalScore >= 85) rank = 'S'; // Top 15%
    else if (totalScore >= 65) rank = 'A+'; // Top 35%
    else if (totalScore >= 45) rank = 'A'; // Top 55%
    else if (totalScore >= 30) rank = 'A-';
    else if (totalScore >= 15) rank = 'B+';
    else if (totalScore >= 5) rank = 'B';
    
    // --- Language Percentages ---
    const langsArray = Object.keys(languageStats).map(name => {
      const percentage = totalSize > 0 ? ((languageStats[name].size / totalSize) * 100).toFixed(1) : 0;
      return { name, percentage, color: languageStats[name].color };
    }).sort((a, b) => b.percentage - a.percentage).slice(0, 5);

    // --- SVG Generation (Same Modern Design) ---
    const width = 450;
    const height = 195;
    const displayName = viewer.name || viewer.login;

    const css = `
      <style>
        .container { font-family: 'Segoe UI', Ubuntu, Sans-Serif; fill: #c9d1d9; }
        .header { font-weight: 700; font-size: 18px; fill: #58a6ff; }
        .stat-label { font-size: 12px; fill: #8b949e; font-weight: 500; }
        .stat-value { font-weight: 700; font-size: 14px; fill: #e6edf3; }
        .rank-text { font-weight: 800; font-size: 38px; fill: #f0e130; text-anchor: middle; filter: drop-shadow(0px 0px 2px rgba(240, 225, 48, 0.5)); }
        .rank-label { font-weight: 700; font-size: 10px; fill: #8b949e; letter-spacing: 1.5px; text-anchor: middle; }
        .lang-text { font-size: 10px; fill: #8b949e; font-weight: 500; }
        .card-bg { fill: #0d1117; stroke: #30363d; stroke-width: 1; }
      </style>
    `;

    // Progress circle calculation (based on score)
    const circumference = 220; // 2 * pi * 35 approx
    const strokeDashoffset = circumference - (totalScore / 100) * circumference;

    let svgContent = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        ${css}
        <rect x="0.5" y="0.5" width="${width-1}" height="${height-1}" rx="10" ry="10" class="card-bg"/>

        <text x="25" y="30" class="header">${displayName}'s GitHub Stats</text>

        <g transform="translate(360, 65)">
          <circle cx="0" cy="0" r="35" fill="none" stroke="#21262d" stroke-width="5"/>
          <circle cx="0" cy="0" r="35" fill="none" stroke="#58a6ff" stroke-width="5" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" transform="rotate(-90)" stroke-linecap="round"/>
          <text x="0" y="12" class="rank-text">${rank}</text>
          <text x="0" y="48" class="rank-label">RANK</text>
        </g>

        <g transform="translate(25, 60)">
           <g>
             <text x="0" y="0" class="stat-label">⭐ Total Stars</text>
             <text x="90" y="0" class="stat-value">${totalStars}</text>
             
             <text x="0" y="22" class="stat-label">🔄 Commits</text>
             <text x="90" y="22" class="stat-value">${totalCommits}</text>
             
             <text x="0" y="44" class="stat-label">🔀 PRs</text>
             <text x="90" y="44" class="stat-value">${totalPRs}</text>
           </g>
           
           <g transform="translate(150, 0)">
             <text x="0" y="0" class="stat-label">📦 Repos</text>
             <text x="80" y="0" class="stat-value">${totalRepos}</text>
             
             <text x="0" y="22" class="stat-label">🐛 Issues</text>
             <text x="80" y="22" class="stat-value">${totalIssues}</text>
             
             <text x="0" y="44" class="stat-label">👥 Contribs</text>
             <text x="80" y="44" class="stat-value">${totalCollabs}</text>
           </g>
        </g>

        <line x1="25" y1="130" x2="425" y2="130" stroke="#21262d" stroke-width="1"/>

        <g transform="translate(25, 145)">
            <clipPath id="bar-clip">
                <rect x="0" y="0" width="400" height="8" rx="4"/>
            </clipPath>
            <g clip-path="url(#bar-clip)">
    `;

    let xOffset = 0;
    langsArray.forEach(lang => {
        const barWidth = (parseFloat(lang.percentage) / 100) * 400;
        if (barWidth > 0) {
            svgContent += `<rect x="${xOffset}" y="0" width="${barWidth}" height="8" fill="${lang.color || '#ccc'}"/>`;
            xOffset += barWidth;
        }
    });

    svgContent += `
            </g>
        </g>
        
        <g transform="translate(25, 170)">
    `;

    let legendX = 0;
    langsArray.forEach(lang => {
        svgContent += `
        <circle cx="${legendX}" cy="-3" r="4" fill="${lang.color || '#ccc'}"/>
        <text x="${legendX + 8}" y="0" class="lang-text">${lang.name} ${lang.percentage}%</text>
        `;
        legendX += 80;
    });

    svgContent += `</g></svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(svgContent);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", details: error.toString() });
  }
}
