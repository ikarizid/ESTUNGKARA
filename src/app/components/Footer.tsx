export function Footer() {
  return (
    <footer className="bg-[#2D7A3E] text-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm md:text-base">
            Kelas PAI A2 23 - Universitas Islam Raden Rahmat Malang
          </p>
          <p className="text-xs text-green-100 mt-2">
            © {new Date().getFullYear()} Portal Informasi Kelas
          </p>
        </div>
      </div>
    </footer>
  );
}
