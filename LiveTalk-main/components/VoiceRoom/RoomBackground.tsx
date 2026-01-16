
import React from 'react';

interface RoomBackgroundProps {
  background: string;
}

const RoomBackground: React.FC<RoomBackgroundProps> = ({ background }) => {
  const isImage = background?.includes('http') || background?.includes('data:image');

  return (
    <div className="absolute inset-0 z-0">
      {isImage ? (
        <img 
          src={background} 
          className="w-full h-full object-cover" 
          alt="Room Background" 
        />
      ) : (
        <div className="w-full h-full" style={{ background: background || '#020617' }}></div>
      )}
      
      {/* 
          تم حذف أي طبقات تعتيم (Overlays) نهائياً لضمان ظهور 
          تصاميم الأجنحة والبروفايلات المرفوعة بنقائها الأصلي 
      */}
    </div>
  );
};

export default RoomBackground;
