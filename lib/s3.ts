import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET ?? process.env.AWS_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_KEY;

const s3Client = new S3Client({
    region,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
});

export async function uploadToS3(
    buffer: Buffer,
    key: string,
    contentType: string
): Promise<string> {
    if (!bucket) {
        throw new Error("AWS_S3_BUCKET (or AWS_BUCKET_NAME) is not set");
    }
    if (!region) {
        throw new Error("AWS_REGION is not set");
    }

    await s3Client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );

    const publicBaseUrl =
        process.env.AWS_S3_PUBLIC_URL ?? `https://${bucket}.s3.${region}.amazonaws.com`;

    return `${publicBaseUrl}/${key}`;
}
