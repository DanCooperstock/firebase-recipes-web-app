import { useState, useRef, useEffect, startTransition } from "react";
import React from "react";
import { v4 as uuidV4 } from "uuid";
import FirebaseStorageService from "FirebaseStorageService";

export default function ImageUploadPreview({
  basePath,
  existingImageUrl,
  handleUploadFinish,
  handleUploadCancel,
}) {
  const [uploadProgress, setUploadProgress] = useState(-1);
  const [imageUrl, setImageUrl] = useState("");

  const fileInputRef = useRef();

  useEffect(() => {
    if (existingImageUrl) {
      startTransition(() => setImageUrl(existingImageUrl));
    } else {
      startTransition(() => setImageUrl(""));
      // @ts-ignore
      fileInputRef.current.value = null;
      setUploadProgress(-1);
    }
  }, [existingImageUrl]);

  async function handleFileChanged(event) {
    const files = event.target.files;
    const file = files[0];
    if (!file) {
      alert("File selection failed. Please try again.");
      return;
    }
    const generatedFileId = uuidV4(); // GUID
    try {
      const downloadUrl = await FirebaseStorageService.uploadFile(
        file,
        `${basePath}/${generatedFileId}`,
        setUploadProgress
      );
      setImageUrl(downloadUrl);
      handleUploadFinish(downloadUrl);
    } catch (error) {
      setUploadProgress(-1);
      // @ts-ignore
      fileInputRef.current.value = null;
      alert(error.message);
      throw error;
    }
  }

  function handleCancelImageClick() {
    FirebaseStorageService.deleteFile(imageUrl);
    // @ts-ignore
    fileInputRef.current.value = null;
    setImageUrl("");
    setUploadProgress(-1);
    handleUploadCancel();
  }

  return (
    <div className="image-upload-preview-container">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChanged}
        ref={fileInputRef}
        hidden={uploadProgress > -1 || imageUrl > ""}
      />
      {!imageUrl && uploadProgress > -1 ? (
        <div>
          <label htmlFor="file">Upload Progress:</label>
          <progress id="file" value={uploadProgress} max="100">
            {uploadProgress}%
          </progress>
          <span>{uploadProgress}%</span>
        </div>
      ) : null}
      {imageUrl ? (
        <div className="image-preview">
          <img src={imageUrl} alt={imageUrl} className="image" />
          <button
            type="button"
            onClick={handleCancelImageClick}
            className="primary-button"
          >
            Cancel Image
          </button>
        </div>
      ) : null}
    </div>
  );
}
