"use client"
import React, { useState, useEffect, useRef } from 'react'
import { CldImage } from 'next-cloudinary'
import { Eye } from 'lucide-react';

const socialFormats = {
  "Instagram Square (1:1)": { width: 1080, height: 1080, aspectRatio: "1:1" },
  "Instagram Portrait (4:5)": { width: 1080, height: 1350, aspectRatio: "4:5" },
  "Twitter Post (16:9)": { width: 1200, height: 675, aspectRatio: "16:9" },
  "Twitter Header (3:1)": { width: 1500, height: 500, aspectRatio: "3:1" },
  "Facebook Cover (205:78)": { width: 820, height: 320, aspectRatio: "205:78" }
};

type SocialFormat = keyof typeof socialFormats;

function SocialShare() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>('Instagram Square (1:1)');
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransfoming] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // --- Transformation State ---
  const [removeBackground, setRemoveBackground] = useState(false);
  const [enhance, setEnhance] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [debouncedBrightness, setDebouncedBrightness] = useState(0);
  const [sepia, setSepia] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const [activeRecolor, setActiveRecolor] = useState<{prompt: string, to: string} | null>(null);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBrightness(brightness), 300);
    return () => clearTimeout(timer);
  }, [brightness]);

  // Loading trigger
  useEffect(() => {
    if (uploadedImage) setIsTransfoming(true);
  }, [selectedFormat, uploadedImage, removeBackground, enhance, debouncedBrightness, sepia, grayscale, activeRecolor]);

  const handleReset = () => {
    setRemoveBackground(false);
    setEnhance(false);
    setBrightness(0);
    setSepia(false);
    setGrayscale(false);
    setActiveRecolor(null);
  };

  // CLEANUP FUNCTION
  const deleteImageFromCloudinary = async (publicId: string) => {
    try {
      await fetch('/api/image-upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: publicId }),
      });
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. If an image already exists, clean it up before uploading new one
    if (uploadedImage) {
      await deleteImageFromCloudinary(uploadedImage);
    }

    setIsUploading(true);
    handleReset(); // Reset filters for the new image

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/image-upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setUploadedImage(data.public_id);
    } catch (error) {
      alert("Upload failed");
    } finally { 
      setIsUploading(false); 
    }
  };

  useEffect(() => {
    const performCleanup = () => {
      if (uploadedImage) {
        fetch('/api/image-upload/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_id: uploadedImage }),
          keepalive: true,
        });
      }
    };
    window.addEventListener("pagehide", performCleanup);
    return () => {
      window.removeEventListener("pagehide", performCleanup);
    };
  }, [uploadedImage]);

  const handleDownload = () => {
    if (!imageRef.current) return;
    fetch(imageRef.current.src)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited_${selectedFormat.toLowerCase()}.png`;
        a.click();
      });
  };

  return (
    <div className='container mx-auto p-4 max-w-6xl min-h-screen bg-base-100'>
      <header className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-black italic text-primary'>Social Share</h1>
        {uploadedImage && <button className='btn btn-ghost btn-xs text-error' onClick={handleReset}>Reset Filters</button>}
      </header>

      
      <div className={`mb-8 p-6 rounded-2xl border-2 border-dashed transition-all ${uploadedImage ? 'bg-base-200 border-base-300' : 'bg-primary/5 border-primary/20 py-20'}`}>
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70">
            {uploadedImage ? "Change Image" : "Upload Image to Start"}
          </h2>
          <input 
            type="file" 
            onChange={handleFileUpload} 
            className='file-input file-input-bordered file-input-primary w-full shadow-lg' 
          />
          {isUploading && <progress className='progress progress-primary w-full mt-4'></progress>}
        </div>
      </div>

      {uploadedImage && (
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500'>
          
          {/* SIDEBAR CONTROLS */}
          <div className='lg:col-span-4 space-y-4'>
            <div className="collapse collapse-arrow bg-base-200">
              <input type="radio" name="my-accordion" defaultChecked /> 
              <div className="collapse-title font-bold text-sm">1. FORMAT & AI</div>
              <div className="collapse-content space-y-4">
                <select className="select select-bordered select-sm w-full" value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value as SocialFormat)}>
                  {Object.keys(socialFormats).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="flex flex-col gap-2">
                  <label className="label cursor-pointer bg-base-100 px-3 rounded-lg border border-base-300">
                    <span className="label-text text-xs">Remove Background</span>
                    <input type="checkbox" checked={removeBackground} onChange={(e) => setRemoveBackground(e.target.checked)} className="toggle toggle-xs toggle-primary" />
                  </label>
                  <label className="label cursor-pointer bg-base-100 px-3 rounded-lg border border-base-300">
                    <span className="label-text text-xs">AI Enhance</span>
                    <input type="checkbox" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} className="toggle toggle-xs toggle-secondary" />
                  </label>
                </div>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="radio" name="my-accordion" /> 
              <div className="collapse-title font-bold text-sm">2. ADJUSTMENTS</div>
              <div className="collapse-content space-y-4">
                <div className="flex gap-2">
                  <button className={`btn btn-xs flex-1 ${sepia ? 'btn-accent' : ''}`} onClick={()=>setSepia(!sepia)}>Sepia</button>
                  <button className={`btn btn-xs flex-1 ${grayscale ? 'btn-accent' : ''}`} onClick={()=>setGrayscale(!grayscale)}>B&W</button>
                </div>
                <div>
                  <label className="text-[10px] font-bold">BRIGHTNESS: {brightness}</label>
                  <input type="range" min="-99" max="100" value={brightness} onChange={(e)=>setBrightness(parseInt(e.target.value))} className="range range-xs range-primary" />
                </div>
              </div>
            </div>

            <button className='btn btn-primary w-full shadow-xl' onClick={handleDownload}>Download Final Image</button>
          </div>

          {/* PREVIEW */}
          <div className='lg:col-span-8 space-y-4'>
            <div className='relative rounded-3xl overflow-hidden bg-neutral shadow-2xl min-h-[400px] flex items-center justify-center border-4 border-base-200'>
              {isTransforming && !showOriginal && (
                <div className='absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-md'>
                  <span className='loading loading-infinity loading-lg text-white'></span>
                </div>
              )}

              {showOriginal ? (
                 <CldImage width={socialFormats[selectedFormat].width} height={socialFormats[selectedFormat].height} src={uploadedImage} alt="Original" crop="fill" gravity="face" />
              ) : (
                <CldImage
                  width={socialFormats[selectedFormat].width}
                  height={socialFormats[selectedFormat].height}
                  aspectRatio={socialFormats[selectedFormat].aspectRatio}
                  src={uploadedImage}
                  alt='transformed'
                  crop="fill"
                  gravity='face'
                  ref={imageRef}
                  onLoad={() => setIsTransfoming(false)}
                  removeBackground={removeBackground}
                  enhance={enhance}
                  brightness={debouncedBrightness !== 0 ? debouncedBrightness.toString() : undefined}
                  sepia={sepia ? true : undefined}
                  grayscale={grayscale ? true : undefined}
                />
              )}
              
              <button 
                className="absolute top-4 right-4 btn btn-circle btn-sm btn-glass z-30"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
              ><Eye className="w-4 h-4" /></button>
            </div>
            <p className="text-center text-[10px] opacity-40 uppercase font-bold tracking-widest">Hold icon to compare original</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SocialShare