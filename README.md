# 🚀 FillMe - Your Files Deserve Better

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</div>

<div align="center">
  <h3>🎯 Smart File Storage • 🏷️ Intelligent Tagging • ⚡ Lightning Search</h3>
  <p><em>Because your files deserve a home that doesn't judge their size!</em></p>
</div>

---

## ✨ What Makes FillMe Special?

Ever tried to share a file and got slapped with "file too large"? Yeah, we've all been there. FillMe is different.

### 🎪 **The Magic Features**
- **🧠 Smart Tagging System** - Files that actually remember where they belong
- **⚡ Lightning Search** - No more "where did I put that PDF?" moments
- **🎨 Clean Interface** - Beautiful UI that doesn't make you cry
- **📱 Responsive Design** - Works everywhere, looks stunning everywhere
- **🔐 Secure Storage** - Your files are safe with enterprise-grade security

### 🛠️ **Built With Love & Modern Tech**
- **Next.js 15** - The React framework that just works
- **Supabase** - Backend that scales like magic
- **TypeScript** - Because we like our code bug-free
- **Tailwind CSS** - Styling that doesn't suck
- **Shadcn/ui** - Components that look professional

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- A Supabase account (free tier works!)

### 1. Clone & Install
```bash
git clone https://github.com/Sayar-212/FillMe.git
cd FillMe
npm install
```

### 2. Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Run the SQL from `lib/database.sql` in your Supabase SQL editor.

### 4. Storage Setup
1. Create a bucket named `files` in Supabase Storage
2. Make it public
3. Set up the policies (check the code for examples)

### 5. Launch! 🎉
```bash
npm run dev
```

Visit `http://localhost:3000` and start uploading!

---

## 💸 The Honest Truth

I'm currently running on the "broke developer" tier, so there are some limits:
- **30MB** per file (because I'm too poor for bigger storage 😅)
- **100MB** total per user (with a 10MB grace buffer because I'm nice)
- **Unlimited** dreams and ambitions! 🌟

*Once this thing takes off and I'm swimming in cash, we're going UNLIMITED!* 🏊♂️💰

---

## 🎯 Perfect For

- **Developers** sharing code snippets and docs
- **Designers** managing assets and mockups  
- **Students** organizing research and assignments
- **Anyone** tired of juggling 47 different cloud storage apps

---

## 🛣️ Roadmap

- [ ] **Folder Organization** - Because chaos isn't always fun
- [ ] **File Sharing** - Send links that actually work
- [ ] **Bulk Operations** - Select all the things!
- [ ] **Advanced Search** - Find files by content, not just name
- [ ] **Team Workspaces** - Collaboration made easy
- [ ] **Mobile App** - Native iOS/Android experience

---

## 🤝 Contributing

Found a bug? Have an idea? Want to make FillMe even more awesome?

1. Fork it
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Supabase** for the amazing backend-as-a-service
- **Vercel** for seamless deployments
- **Shadcn** for the beautiful UI components
- **You** for checking out this project! ⭐

---

<div align="center">
  <h3>🌟 If FillMe made your life easier, give it a star! 🌟</h3>
  <p>Built with ❤️ by <a href="https://github.com/Sayar-212">Sayar</a></p>
  
  <p><em>Remember: Life's too short for boring file storage! 🎭</em></p>
</div>