export default async function handler(req, res) {
    return res.status(200).json({
        FLW_SECRET_KEY_exists: !!process.env.FLW_SECRET_KEY,
        FLW_SECRET_KEY_first5: process.env.FLW_SECRET_KEY 
            ? process.env.FLW_SECRET_KEY.substring(0, 5) 
            : 'NOT FOUND',
        all_keys: Object.keys(process.env).filter(key => 
            key.startsWith('FLW') || 
            key.startsWith('PAYSTACK')
        ),
    });
}