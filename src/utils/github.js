/**
 * Fetches the latest public repositories for a given GitHub username.
 * Used for the "Content Sync" skill to keep the portfolio fresh.
 */
export async function fetchLatestGithubProjects(username = 'cory-garms', limit = 4) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=${limit}`);
    
    if (!response.ok) {
      console.warn(`GitHub API ratelimit or error: ${response.status}`);
      return [];
    }

    const repos = await response.json();
    
    // Map the GitHub repo data to match our PortfolioGrid data structure
    return repos.map(repo => ({
      title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Title Case
      category: "GitHub Resource",
      image: "", // Fallback to a code-pattern background in the UI if no image
      link: repo.html_url,
      description: repo.description || "A public GitHub repository."
    }));
  } catch (error) {
    console.error("Failed to fetch from GitHub:", error);
    return [];
  }
}
