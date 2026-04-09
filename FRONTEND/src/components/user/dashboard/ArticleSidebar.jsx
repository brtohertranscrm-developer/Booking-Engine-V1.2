import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';

export default function ArticleSidebar({ navigate }) {
  // Mock data sementara (Nanti bisa diganti dengan data dari API useUserDashboard)
  const articles = [
    {
      id: 1,
      title: "5 Spot Sunrise Terbaik di Jogja untuk Anak Motor",
      category: "Tips Wisata",
      date: "12 Apr",
      image: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?q=80&w=200&auto=format&fit=crop",
      color: "bg-emerald-100 text-emerald-700"
    },
    {
      id: 2,
      title: "Promo Spesial Lebaran: Diskon Sewa NMAX 20%",
      category: "Promo",
      date: "10 Apr",
      image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=200&auto=format&fit=crop",
      color: "bg-rose-100 text-rose-700"
    },
    {
      id: 3,
      title: "Cara Aman Berkendara Jarak Jauh Malam Hari",
      category: "Edukasi",
      date: "08 Apr",
      image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=200&auto=format&fit=crop",
      color: "bg-blue-100 text-blue-700"
    }
  ];

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <BookOpen size={16} className="text-indigo-500"/> Bacaan Menarik
        </h3>
      </div>

      <div className="space-y-4 flex-1">
        {articles.map((article) => (
          <div 
            key={article.id} 
            onClick={() => navigate(`/article/${article.id}`)}
            className="group flex gap-4 items-center cursor-pointer p-2 -mx-2 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            {/* Thumbnail */}
            <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden relative">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            
            {/* Konten Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${article.color}`}>
                  {article.category}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  • {article.date}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {article.title}
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Tombol Lihat Semua */}
      <button 
        onClick={() => navigate('/articles')}
        className="mt-4 w-full flex items-center justify-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors pt-4 border-t border-slate-100"
      >
        Lihat Semua Artikel <ChevronRight size={14} />
      </button>
    </div>
  );
}