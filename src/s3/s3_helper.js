// s3Helper.js
import { S3Client, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

function createCheckResult() {
  return {
    exists: false,
    expiredByLifecycle: false,
    presignedUrlValid: false,
  };
}

class S3Helper {
  static instance = null;

  constructor(region=process.env.S3_REGION) {
    this.region = region;
    this.initialized = false;
    this.client = null;
  }

  

  static getInstance(region=process.env.S3_REGION) {
    if (!S3Helper.instance) {
      S3Helper.instance = new S3Helper(region);
    }
    return S3Helper.instance;
  }




  init() {
    if (!this.initialized) {
      this.client = new S3Client({
        region: this.region,
      });
      this.initialized = true;
    }
  }




  async generatePresignedUrlAsync(bucket, key, expiresInSeconds = 3600) {
    this.init();
    try {
      const command = new PutObjectCommand({ Bucket: bucket, Key: key });
      const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
      return url;
    } catch (err) {
      console.error(" Failed to generate presigned URL:", err);
      throw new Error("Presigned URL generation failed");
    }
  }




  async verifyObjectExistsAsync(bucket, key) {
    this.init();
    const result = createCheckResult();
    try {
      const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
      const response = await this.client.send(command);

      result.exists = true;
      result.expiredByLifecycle = !!response.Expiration;
      result.presignedUrlValid = true;
    } catch (err) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        result.exists = false;
      } else {
        console.warn("S3 verification error:", err);
      }
    }
    return result;
  }

  /**
   * Delete an object from S3 (async).
   * Returns { success: boolean, deleted: boolean, message?: string }
   * Note: for versioned buckets you need to pass VersionId to delete a specific version.
   */
  async deleteObjectAsync(bucket, key, options = {}) {
    // options: { maxRetries: number, retryDelayMs: number, versionId: string }
    this.init();

    const maxRetries = options.maxRetries ?? 3;
    let retryDelayMs = options.retryDelayMs ?? 200;
    const versionId = options.versionId; // optional

    for (let attempt = 1; attempt <= maxRetries; ++attempt) {
      try {
        const params = { Bucket: bucket, Key: key };
        if (versionId) params.VersionId = versionId;

        const cmd = new DeleteObjectCommand(params);
        const res = await this.client.send(cmd);

        // S3 DeleteObject is idempotent: deletion succeeds even if object does not exist
        // SDK will throw only on hard errors (permissions, network, etc.)
        return { success: true, deleted: true };
      } catch (err) {
        // If it's a permanent error (permissions), return immediately
        const status = err.$metadata?.httpStatusCode;
        console.error(`S3 delete attempt ${attempt} failed for ${bucket}/${key}:`, err);

        if (status === 403 || status === 401) {
          return { success: false, deleted: false, message: "Permission denied" };
        }

        // transient network error? retry
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, retryDelayMs));
          retryDelayMs *= 2;
          continue;
        }

        // final failure
        return { success: false, deleted: false, message: err.message || String(err) };
      }
    }
  }
}

export default S3Helper;