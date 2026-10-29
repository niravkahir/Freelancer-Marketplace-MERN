# 💼 Freelancer Marketplace

A full-stack MERN (MongoDB, Express, React, Node.js) application designed to connect skilled freelancers with clients. The platform features secure authentication, project posting, proposal management, real-time chat, and integrated payments.

## 🌐 Live Demo

- **Frontend Application:** [https://freelancer-marketplace-nu.vercel.app](https://freelancer-marketplace-nu.vercel.app)
- **Backend API:** [https://freelancer-marketplace-backend-zu9n.onrender.com](https://freelancer-marketplace-backend-zu9n.onrender.com)

*(Note: The backend is hosted on Render's free tier and may take ~50 seconds to wake up on the first request.)*

## ✨ Features

- **User Roles:** Separate dashboards for Clients, Freelancers, and Admins.
- **Authentication:** Secure JWT-based login and registration.
- **Project Management:** Clients can post projects with budgets and required skills.
- **Proposals:** Freelancers can submit bids and cover letters.
- **Real-time Chat:** Instant messaging between clients and freelancers using Socket.io.
- **Payments:** Integrated Razorpay gateway for secure transactions.
- **File Uploads:** Cloudinary integration for profile pictures and project assets.
- **AI Assistant:** Groq API integration to help users generate project descriptions and proposals.
- **Support Tickets:** Built-in support system for user inquiries.

## 🛠️ Tech Stack

**Frontend:**
- React.js (Vite)
- React Router
- Axios
- Socket.io-client
- Custom CSS (Responsive Design)

**Backend:**
- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT)
- Socket.io
- Cloudinary (Image Hosting)
- Razorpay (Payments)
- Groq SDK (AI)

## 🚀 Local Development Setup

To run this project locally on your machine, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/niravkahir/Freelancer-Marketplace-MERN.git
cd Freelancer-Marketplace-MERN
