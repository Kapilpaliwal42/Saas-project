import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import cloudinary from "cloudinary";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})




export async function DELETE(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        
        const public_id = await request.json().then(data => data.public_id);
        if (!public_id) {
            return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
        }
        console.log("Public ID to delete:", public_id);
        const result = await cloudinary.v2.uploader.destroy(public_id, { resource_type: 'image', invalidate: true ,type:'upload'});
        console.log("Cloudinary result:", result);
        return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 });
    } catch (error:any) {
       console.log("error deleting image",error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
