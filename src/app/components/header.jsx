import HeaderCenterText from './HeaderCenterText';
function Header() {
  return (
    <header data-aos="fade-down" className="border-b border-t bg-gray-300 shadow-md py-3 px-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500  ">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div data-aos='fade-right' data-aos-delay="300" className="flex items-center shadow-2xl">
          <img
            src="/datalytics logo4.png"
            alt="Datalytics Logo"
            className="h-16 w-80 rounded-lg border-gray-700 animate-pulse border "
          />
        </div>
        <div data-aos='zoom-in' data-aos-delay="300" className="flex justify-center items-center">
          <HeaderCenterText />
        </div>




        <nav className="hidden md:flex space-x-6 text-gray-700 font-bold text-lg">

          <div data-aos='fade-left' className="flex justify-center items-center min-w-fit px-2 h-10 rounded-lg shadow-xl  border-b-blue-900 border-2 bg-yellow-100">
            <a href="#" className="hover:text-blue-600 transition">Home</a>
          </div>
          <div data-aos='fade-left' className="flex justify-center items-center min-w-fit px-2 h-10 rounded-lg shadow-xl  border-b-blue-900 border-2 bg-yellow-100 ">
            <a href="#" className="hover:text-blue-600 transition px-2">Features</a>
          </div>
          <div data-aos='fade-left' className="flex justify-center items-center min-w-fit px-2 h-10 rounded-lg shadow-xl  border-b-blue-900 border-2 bg-yellow-100">
            <a href="#" className="hover:text-blue-600 transition px-2">Contact</a>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
