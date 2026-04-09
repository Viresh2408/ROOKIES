import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type AwsConfig = {
    region: string;
    bucket: string;
    credentials: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
    };
};

function resolveAwsConfig(): AwsConfig {
    const region = (process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "").trim();
    const bucket = (process.env.AWS_S3_BUCKET ?? process.env.AWS_BUCKET_NAME ?? "").trim();
    const accessKeyIdRaw =
        process.env.AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY ?? "";
    const secretAccessKeyRaw =
        process.env.AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_KEY ?? "";
    const sessionToken = process.env.AWS_SESSION_TOKEN?.trim();

    const missing: string[] = [];
    if (!bucket) missing.push("AWS_S3_BUCKET or AWS_BUCKET_NAME");
    if (!region) missing.push("AWS_REGION or AWS_DEFAULT_REGION");
    if (!accessKeyIdRaw.trim() || !secretAccessKeyRaw.trim()) {
        missing.push("AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or AWS_ACCESS_KEY/AWS_SECRET_KEY");
    }

    if (missing.length > 0) {
        throw new Error(`Missing AWS env vars: ${missing.join(", ")}`);
    }

    return {
        region,
        bucket,
        credentials: {
            accessKeyId: accessKeyIdRaw.trim(),
            secretAccessKey: secretAccessKeyRaw.trim(),
            ...(sessionToken ? { sessionToken } : {}),
        },
    };
}

export async function uploadToS3(
    buffer: Buffer,
    key: string,
    contentType: string
): Promise<string> {
    const { bucket, region, credentials } = resolveAwsConfig();
    const s3Client = new S3Client({ region, credentials });

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
