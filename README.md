# 📊 GitHub Stats Generator (Vercel Edition)

A self-hosted, high-performance GitHub stats generator built with **Node.js** and **GraphQL**. This tool generates a dynamic SVG card displaying your total stars, commits (public + private), pull requests, issues, and top languages in a clean grid layout.

![Demo Stats](https://readme-md-coral.vercel.app/api)
*(This is a live demo using my own deployment)*

## 🚀 Features

- **Detailed Stats:** Counts **Private** and **Public** contributions separately (commits, repos, forks).
- **Top Languages Grid:** Displays up to **12 languages** in a clean 3-column grid.
- **Auto-Expanding Layout:** Automatically adjusts height based on your language count.
- **Smart Footer:** Shows remaining language count if you have more than 12.
- **Neon Dark Theme:** Designed to look beautiful on dark-mode profiles.
- **Fast & Cached:** Optimized for Vercel with smart caching.

---

## 🛠️ How to Deploy Your Own

Since this API uses the `viewer` GraphQL query, it displays stats for the **owner of the Personal Access Token**. You need to deploy your own instance to show *your* stats.

### Step 1: Fork & Clone
Fork this repository to your GitHub account.

### Step 2: Generate GitHub Token
1. Go to **Settings** > **Developer Settings** > **Personal Access Tokens (Classic)**.
2. Generate a new token with these scopes:
   - `repo` (Full control of private repositories)
   - `read:user` (Read user profile data)
3. Copy the token.

### Step 3: Deploy to Vercel
1. Go to [Vercel](https://vercel.com/) and add a new project.
2. Import your forked repository.
3. In **Environment Variables**, add:
   - **Key:** `GITHUB_TOKEN`
   - **Value:** `your_token_here`
4. Click **Deploy**.

---

## 📌 Usage

Once deployed, you can use the API URL in your GitHub Profile `README.md`.

```markdown
<div align="center">
  <img src="[https://your-app-name.vercel.app/api](https://your-app-name.vercel.app/api)" alt="My GitHub Stats" width="450" />
</div>
```
## Force Refresh (If needed)

```markdown
<img src="[https://your-app-name.vercel.app/api?v=1](https://your-app-name.vercel.app/api?v=1)" />
```

## 🔧 Technologies Used

1.Runtime: Node.js (Vercel Serverless Functions)
2.Data Source: GitHub GraphQL API v4
3.Styling: SVG + CSS

## 👤 Author

  <a href="https://github.com/sh4lu-z">
    <img src="https://img.shields.io/badge/@sh4lu--z-black?style=for-the-badge&logo=github" alt="sh4lu-z" />
  </a>

Give a ⭐️ if you like this project!
