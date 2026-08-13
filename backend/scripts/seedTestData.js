const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const Message = require('../models/Message');

// Check if MongoDB URI is set
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    console.error('📝 Please add: MONGODB_URI=mongodb://localhost:27017/freelancer_marketplace');
    process.exit(1);
}

const seedData = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB...');

        // Clear existing data (optional)
        console.log('🧹 Clearing existing data...');
        await User.deleteMany({});
        await FreelancerProfile.deleteMany({});
        await ClientProfile.deleteMany({});
        await Project.deleteMany({});
        await Proposal.deleteMany({});
        await Message.deleteMany({});

        // Create a test freelancer
        console.log('📝 Creating test freelancer...');
        const freelancerUser = new User({
            name: 'John Freelancer',
            email: 'john@freelancer.com',
            password: 'Freelancer123',
            phone: '9876543210',
            role: 'FREELANCER',
            isEmailVerified: true
        });
        await freelancerUser.save();
        console.log(`✅ Freelancer created: ${freelancerUser._id}`);

        // Create freelancer profile
        const freelancerProfile = new FreelancerProfile({
            userId: freelancerUser._id,
            title: 'Full Stack Developer',
            bio: 'Experienced MERN stack developer with 5 years of experience',
            skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript'],
            hourlyRate: 50,
            experienceYears: 5,
            rating: 4.5,
            projectsCompleted: 20,
            isAvailable: true,
            location: 'New York, USA'
        });
        await freelancerProfile.save();
        console.log(`✅ Freelancer profile created: ${freelancerProfile._id}`);

        // Create a test client
        console.log('📝 Creating test client...');
        const clientUser = new User({
            name: 'Jane Client',
            email: 'jane@client.com',
            password: 'Client123',
            phone: '9876543211',
            role: 'CLIENT',
            isEmailVerified: true
        });
        await clientUser.save();
        console.log(`✅ Client created: ${clientUser._id}`);

        // Create client profile
        const clientProfile = new ClientProfile({
            userId: clientUser._id,
            companyName: 'Tech Innovations Inc',
            companyWebsite: 'www.techinnovations.com',
            industry: 'Technology',
            companySize: '51-200',
            verified: true,
            location: 'San Francisco, USA'
        });
        await clientProfile.save();
        console.log(`✅ Client profile created: ${clientProfile._id}`);

        // Create a project
        console.log('📝 Creating test project...');
        const project = new Project({
            clientId: clientUser._id,
            title: 'E-Commerce Website Development',
            description: 'Build a full-featured e-commerce website with MERN stack. Features include user authentication, product catalog, shopping cart, payment integration, and admin dashboard.',
            budget: 60000,
            category: 'Web Development',
            subCategory: 'E-Commerce',
            skillsRequired: ['React', 'Node.js', 'MongoDB', 'Express', 'Stripe API'],
            experienceLevel: 'Intermediate',
            projectType: 'Fixed',
            deadline: new Date('2026-12-31'),
            status: 'Open'
        });
        await project.save();
        console.log(`✅ Project created: ${project._id} (ID: ${project.projectId})`);

        // Create a proposal
        console.log('📝 Creating test proposal...');
        const proposal = new Proposal({
            projectId: project._id,
            freelancerId: freelancerUser._id,
            coverLetter: 'I am a perfect fit for this project. I have built over 10 e-commerce websites using the MERN stack. My experience includes implementing payment gateways, optimizing performance, and ensuring security best practices.',
            bidAmount: 55000,
            estimatedTime: 30,
            status: 'Pending'
        });
        await proposal.save();
        console.log(`✅ Proposal created: ${proposal._id} (ID: ${proposal.proposalId})`);

        // Create a message
        console.log('📝 Creating test message...');
        const message = new Message({
            senderId: freelancerUser._id,
            receiverId: clientUser._id,
            content: 'Hi Jane! I would like to discuss your project in more detail. I have some questions about the payment integration requirements.',
            isRead: false
        });
        await message.save();
        console.log(`✅ Message created: ${message._id}`);

        console.log('\n🎉 ===== TEST DATA SEEDED SUCCESSFULLY ===== 🎉');
        console.log('📊 Summary:');
        console.log(`   👤 Freelancer: ${freelancerUser.name} (${freelancerUser.email})`);
        console.log(`   👤 Client: ${clientUser.name} (${clientUser.email})`);
        console.log(`   📋 Project: ${project.title} ($${project.budget})`);
        console.log(`   📄 Proposal: $${proposal.bidAmount} (${proposal.status})`);
        console.log(`   💬 Message: "${message.content}"`);
        console.log('\n🔑 Test Login Credentials:');
        console.log(`   Freelancer: john@freelancer.com / Freelancer123`);
        console.log(`   Client: jane@client.com / Client123`);
        console.log('\n📝 IDs for reference:');
        console.log(`   Freelancer ID: ${freelancerUser._id}`);
        console.log(`   Client ID: ${clientUser._id}`);
        console.log(`   Project ID: ${project._id}`);
        console.log(`   Proposal ID: ${proposal._id}`);

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        await mongoose.disconnect();
        process.exit(1);
    }
};

seedData();