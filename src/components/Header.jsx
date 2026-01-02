import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ChevronDown,
  Plus,
  User,
  Bookmark,
  Settings,
  LogOut
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function Header({
  user,
  onSignInClick,
  onGetStartedClick,
  onSignOut,
  mobileMenuOpen,
  setMobileMenuOpen
}) {
  const location = useLocation();
  const isLoggedIn = Boolean(user);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Click outside listener to close user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Get user display info
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'user@example.com';
  const userInitial = userName.charAt(0).toUpperCase();

  const navDropdowns = [
    {
      name: "Resources",
      items: [
        { name: "Capital", path: createPageUrl("Funding") },
        { name: "Co-Working", path: createPageUrl("Workspaces") },
        { name: "Startup Toolkit", path: createPageUrl("Resources") }
      ]
    },
    {
      name: "Ecosystem",
      items: [
        { name: "Opportunities", path: createPageUrl("Opportunities") },
        { name: "Hubs & Events", path: createPageUrl("Events") },
        { name: "Community", path: createPageUrl("Community") },
        { name: "Why Chicago", path: createPageUrl("WhyChicago") }
      ]
    }
  ];

  return (
    <header className="bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Left */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 border-2 border-white/45 bg-black flex items-center justify-center">
              <span className="text-white font-black text-base uppercase">CS</span>
            </div>
            <span className="text-lg font-black text-white uppercase tracking-wider hidden sm:block">
              ChiStartup Hub
            </span>
          </Link>

          {/* Navigation - Center */}
          <nav className="hidden md:flex items-center gap-8">
            {navDropdowns.map((dropdown) => (
              <DropdownMenu key={dropdown.name}>
                <DropdownMenuTrigger className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors text-sm font-medium uppercase tracking-wider outline-none">
                  <span>{dropdown.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-gray-900 border border-gray-700 min-w-[180px]"
                  sideOffset={8}
                  align="start"
                >
                  {dropdown.items.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`cursor-pointer px-4 py-2.5 text-sm font-medium transition-colors ${
                          location.pathname === item.path
                            ? 'text-white bg-gray-800'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {dropdown.name === "Resources" && (
                    <>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem asChild>
                        <Link
                          to={createPageUrl("SubmitResource")}
                          className="cursor-pointer px-4 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 flex items-center gap-2"
                        >
                          <Plus className="w-3 h-3" />
                          Submit a Resource
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}

            <Link
              to={createPageUrl("Stories")}
              className={`text-sm font-medium uppercase tracking-wider transition-colors ${
                location.pathname === createPageUrl("Stories")
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              The Blueprints
            </Link>

            <Link
              to={createPageUrl("About")}
              className={`text-sm font-medium uppercase tracking-wider transition-colors ${
                location.pathname === createPageUrl("About")
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              About
            </Link>
          </nav>

          {/* Action Area - Right */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                {/* Logged In: Show Create Ask + Avatar */}
                <Link to={createPageUrl("Opportunities")}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-9 px-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Ask
                  </Button>
                </Link>

                {/* User Avatar with Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                    aria-label="User menu"
                  >
                    <span className="text-white text-sm font-medium uppercase">
                      {userInitial}
                    </span>
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                      {/* Section 1: User Info */}
                      <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-white font-medium truncate">{userName}</p>
                        <p className="text-sm text-gray-400 truncate">{userEmail}</p>
                      </div>

                      {/* Section 2: Navigation */}
                      <div className="py-2">
                        <Link
                          to={createPageUrl("Profile")}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Your Profile</span>
                        </Link>
                        <Link
                          to={createPageUrl("SavedResources")}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        >
                          <Bookmark className="w-4 h-4" />
                          <span>Saved Resources</span>
                        </Link>
                        <Link
                          to={createPageUrl("Settings")}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      {/* Section 3: Sign Out */}
                      <div className="border-t border-gray-800 py-2">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onSignOut?.();
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Logged Out: Show Sign In + Get Started */}
                <button
                  onClick={onSignInClick}
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors px-3 py-2"
                >
                  Sign In
                </button>
                <Button
                  onClick={onGetStartedClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-9 px-4"
                >
                  Get Started
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden relative w-10 h-10 flex items-center justify-center hover:bg-gray-800 transition-colors rounded"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`}
                />
                <span
                  className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800 mt-4">
            <div className="space-y-4">
              {navDropdowns.map((dropdown) => (
                <div key={dropdown.name}>
                  <div className="px-2 py-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    {dropdown.name}
                  </div>
                  {dropdown.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-2 py-3 text-base transition-colors ${
                        location.pathname === item.path
                          ? 'text-white font-semibold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              ))}

              <div className="px-2 py-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                More
              </div>
              <Link
                to={createPageUrl("Stories")}
                className={`block px-2 py-3 text-base transition-colors ${
                  location.pathname === createPageUrl("Stories")
                    ? 'text-white font-semibold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                The Blueprints
              </Link>
              <Link
                to={createPageUrl("About")}
                className={`block px-2 py-3 text-base transition-colors ${
                  location.pathname === createPageUrl("About")
                    ? 'text-white font-semibold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                About
              </Link>

              {/* Mobile Action Buttons */}
              <div className="pt-4 space-y-3">
                {isLoggedIn ? (
                  <>
                    {/* Mobile User Info */}
                    <div className="px-2 py-3 mb-2 bg-gray-900 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-white font-medium uppercase">{userInitial}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{userName}</p>
                          <p className="text-sm text-gray-400 truncate">{userEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Mobile User Navigation */}
                    <Link
                      to={createPageUrl("Profile")}
                      className="flex items-center gap-3 px-2 py-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Your Profile</span>
                    </Link>
                    <Link
                      to={createPageUrl("SavedResources")}
                      className="flex items-center gap-3 px-2 py-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>Saved Resources</span>
                    </Link>
                    <Link
                      to={createPageUrl("Settings")}
                      className="flex items-center gap-3 px-2 py-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>

                    <div className="pt-3 border-t border-gray-800 space-y-3">
                      <Link to={createPageUrl("Opportunities")} className="block">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" />
                          Create Ask
                        </Button>
                      </Link>
                      <button
                        onClick={onSignOut}
                        className="flex items-center justify-center gap-2 w-full text-center text-gray-400 hover:text-red-400 text-sm font-medium py-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={onGetStartedClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full"
                    >
                      Get Started
                    </Button>
                    <button
                      onClick={onSignInClick}
                      className="w-full text-center text-gray-300 hover:text-white text-sm font-medium py-2"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
