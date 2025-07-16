function Header() {
  return (
    <header className="bg-gray-300 shadow-md py-3 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <img
            src="/datalytics_title.jpg"
            alt="Datalytics Logo"
            className="h-16 w-auto rounded-lg border-gray-700 shadow-sm"
          />
        </div>

        
        <nav className="hidden md:flex space-x-6 text-gray-700 font-medium text-lg">
          <a href="#" className="hover:text-blue-600 transition">Home</a>
          <a href="#" className="hover:text-blue-600 transition">Features</a>
          <a href="#" className="hover:text-blue-600 transition">Contact</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
