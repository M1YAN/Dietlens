"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { useState } from 'react';
import { Menu, X, User, Search, Camera, BookOpen, PieChart, Calendar } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-emerald-600">DietLens</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {isAuthenticated ? (
              <>
                <Link href="/food-recognition/upload" className="flex items-center text-gray-700 hover:text-emerald-600">
                  <Camera className="w-5 h-5 mr-1" />
                  <span>识别食物</span>
                </Link>
                <Link href="/food-search/categories" className="flex items-center text-gray-700 hover:text-emerald-600">
                  <Search className="w-5 h-5 mr-1" />
                  <span>食物分类</span>
                </Link>
                <Link href="/nutrition/daily" className="flex items-center text-gray-700 hover:text-emerald-600">
                  <Calendar className="w-5 h-5 mr-1" />
                  <span>营养记录</span>
                </Link>
                <Link href="/community/posts" className="flex items-center text-gray-700 hover:text-emerald-600">
                  <BookOpen className="w-5 h-5 mr-1" />
                  <span>社区</span>
                </Link>
                <Link href="/nutrition/goals" className="flex items-center text-gray-700 hover:text-emerald-600">
                  <PieChart className="w-5 h-5 mr-1" />
                  <span>营养目标</span>
                </Link>
                <div className="relative ml-3">
                  <div className="flex items-center">
                    <Link href="/profile" className="flex items-center text-gray-700 hover:text-emerald-600">
                      {user?.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.username}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="w-8 h-8 p-1 rounded-full bg-gray-200" />
                      )}
                      <span className="ml-2">{user?.username}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="ml-4 px-3 py-1 text-sm text-white bg-emerald-600 rounded hover:bg-emerald-700"
                    >
                      退出
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-700 hover:text-emerald-600">
                  登录
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                >
                  注册
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-emerald-600 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                >
                  首页
                </Link>
                <Link
                  href="/food-recognition/upload"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                >
                  识别食物
                </Link>
                <Link
                  href="/food-search/categories"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                >
                  食物分类
                </Link>
                <Link
                  href="/nutrition/daily"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                >
                  营养记录
                </Link>
                <Link
                  href="/community/posts"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                >
                  社区
                </Link>
                <Link
                  href="/nutrition/goals"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                >
                  营养目标
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                >
                  个人资料
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                >
                  登录
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;