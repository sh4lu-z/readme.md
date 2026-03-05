# 📊 GitHub Stats Generator (Vercel Edition)

A self-hosted, high-performance GitHub stats generator built with **Node.js** and **GraphQL**. This tool generates a dynamic SVG card displaying your total stars, commits (public + private), pull requests, issues, and top languages.

![Demo Stats](https://readme-md-coral.vercel.app/api?v=1)
*(This is a live demo using my own deployment)*

## 🚀 Features

- **ACCURATE Stats:** Counts both **Private** and **Public** contributions (commits, PRs, issues).
- **True Rank System:** Calculates your rank (S, A+, A, B) based on global GitHub standards.
- **Top Languages Grid:** Displays up to **12 languages** in a clean grid layout.
- **Smart Layout:** Auto-adjusts height based on content.
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
  <img src="[https://your-app-name.vercel.app/api?v=1](https://your-app-name.vercel.app/api?v=1)" alt="My GitHub Stats" width="450" />
</div>
```
