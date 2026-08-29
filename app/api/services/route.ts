import {NextResponse, NextRequest} from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req : NextRequest){
    
    const {data, error} = await supabase.from('services').select('*');

    if(error){
        console.log(error.message);
        return NextResponse.json({message : "Internal Server Error"}, {status : 500});
    }

    console.log(data);
    return NextResponse.json(data, {status : 200});

}