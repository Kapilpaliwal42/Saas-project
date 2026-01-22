import cloudinary from 'cloudinary';
import { NextRequest,NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

interface cloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    [key: string]: any;
}

export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return  NextResponse.json({error:'Unauthorized'}, { status: 401 });
    }
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
            return  NextResponse.json({error:'No file found'}, { status: 400 });
        }
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const result = await new Promise<cloudinaryUploadResult>((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream({
                folder: 'next-cloudinary-upload'
            }, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result as cloudinaryUploadResult);
                }
            }).end(buffer);
    })

    return NextResponse.json({
        public_id: result.public_id,
        secure_url: result.secure_url
    }, { status: 200 });

        
    } catch (error) {
        console.log("error upload image",error);
        return NextResponse.json({error:'Internal server error'}, { status: 500 });
    }
}



