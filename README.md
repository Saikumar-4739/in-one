In-One 🌐
In-One is a powerful, AI-driven platform that unifies communication, productivity, and entertainment in a single, seamless experience. From real-time chat to smart task management and media sharing, In-One is your all-in-one solution for staying connected and organized.

  

✨ Key Features
🗨️ Communication

Real-Time Chat: Engage in private or group conversations with instant messaging.
Voice & Video Calls: Crystal-clear audio and video for personal or group calls.
File Sharing: Share documents, images, and more with emoji reactions.
Secret Chats: Secure, encrypted chats with robust contact management.

📋 Productivity

Smart Notes: Create notes with markdown or voice-to-text transcription.
Calendar & Reminders: Organize your schedule with smart reminders and a shared planner.
Event Planning: Collaborate on events with integrated scheduling tools.

🧠 AI-Powered Tools

Auto-Replies: AI-generated responses for quick communication.
Task & Event Suggestions: Personalized recommendations to boost efficiency.
AI Assistant: FastAPI-powered assistant tailored to your needs.

🎉 Entertainment

Media Feed: Share and explore reels, videos, and media content.
Watch Parties: Host group streaming sessions with friends.
Mini-Games & Audio: Enjoy games, audio streaming, and competitive leaderboards.


🛠 Tech Stack



Component
Technology



Frontend
React (Web), React Native (Mobile)


Backend
NestJS, FastAPI (AI Services)


Database
MySQL with TypeORM


Storage
Cloudinary (Media), AWS/GCP (Infra)


Monorepo
Nx Workspace



📥 Installation
Prerequisites

Node.js: v16 or higher
npm or yarn
Python: For FastAPI-based AI services
MySQL: Database setup
Cloudinary and AWS/GCP: For media and infrastructure

Setup Instructions

Clone the Repository:
git clone https://github.com/in-one/in-one.git
cd in-one


Install Dependencies:
npm install --force


Configure Environment Variables:Create a .env file in the project root:
DATABASE_URL=mysql://user:password@localhost:3306/inone
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret


Run the Application:

Web Frontend:npx nx serve ui


Backend Services:npx nx serve services-main


Mobile App:npx nx start mobile


AI Services (FastAPI):npx nx serve python






🧑‍💻 Development

Monorepo: Managed with Nx Workspace for streamlined app and service development.
Code Quality:
Linting: npx nx lint
Formatting: npx nx format


Testing: Run npx nx test for unit and integration tests.
Production Build: Use npx nx build for optimized builds.


🤝 Contributing
We welcome contributions to make In-One even better! To contribute:

Fork the repository.
Create a feature branch: git checkout -b feature/your-feature.
Commit changes: git commit -m "Add your feature".
Push to the branch: git push origin feature/your-feature.
Open a pull request.

See our Contributing Guidelines for more details.

📜 License
This project is licensed under the MIT License.

📧 Contact Us
Have questions or need support? Reach out:

Email: support@inone.app
Twitter: @InOneApp
Discord: Join our Community



  Built with 🚀 by the In-One Team
