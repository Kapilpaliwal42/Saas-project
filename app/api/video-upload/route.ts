import cloudinary from 'cloudinary';
import { NextRequest,NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/prisma';

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

interface cloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number
    [key: string]: any;
}

export async function POST(request: NextRequest) {
    
    try {
        const { userId } = await auth();
    if (!userId) {
        return  NextResponse.json({error:'Unauthorized'}, { status: 401 });
    }
    if(
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ){
        return  NextResponse.json({error:'Missing cloudinary config'}, { status: 500 });
    }
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const originalSize = formData.get('originalSize') as string;

        if (!file) {
            return  NextResponse.json({error:'No file found'}, { status: 400 });
        }
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const result = await new Promise<cloudinaryUploadResult>((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream({
                folder: 'next-cloudinary-video-upload',
                resource_type: 'video',
                transformation:[
                    {quality:"auto",fetch_format:"mp4"}
                ]
            }, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result as cloudinaryUploadResult);
                }
            })
            uploadStream.end(buffer);
    })

    const video = await prisma.video.create({
       data:{
        title,
        description,
        publicId:result.public_id,
        originalSize:originalSize,
        compressedSize:String(result.bytes),
        duration : result.duration || 0       
    } 
    })

    return NextResponse.json(video, { status: 201 });

        
    } catch (error) {
        console.log("error upload video",error);
        return NextResponse.json({error:'Internal server error'}, { status: 500 });
    }finally {
        await prisma.$disconnect();
    }
}




