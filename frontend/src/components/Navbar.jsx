import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();

    return (
        <nav>
            <div className="nav-brand">Freelancer Marketplace</div>
            <div className="nav-links">
                {isAuthenticated ? (
                    <>
                        <span>Welcome, {user?.name}</span>
                        <button onClick={logout}>Logout</button>
                    </>
                ) : (
                    <>
                        <a href="/login">Login</a>
                        <a href="/register">Register</a>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;