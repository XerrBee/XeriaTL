"use client"

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import styles from "./writePage.module.css"
import {useEffect, useState} from "react"
import Image from 'next/image'
import ReactQuill from 'react-quill'
import "react-quill/dist/quill.bubble.css"
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { app } from "@/utils/firebase";

const storage = getStorage(app);

const WritePage = () => {

  const {status} = useSession()
 
  const router = useRouter();

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [media, setMedia] = useState("")
  const [value, setValue] = useState("")
  const [title, setTitle] = useState("")

  useEffect(()=> {
      const upload = () => {
        const name = new Date().getTime + file.name
 
        const storageRef = ref(storage, name);
        const uploadTask = uploadBytesResumable(storageRef, file);


        uploadTask.on('state_changed',
        (snapshot) => {
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        }, 
        (error) => {
          // A full list of error codes is available at
          // https://firebase.google.com/docs/storage/web/handle-errors
          switch (error.code) {
            case 'storage/unauthorized':
              // User doesn't have permission to access the object
              break;
            case 'storage/canceled':
              // User canceled the upload
              break;

            // ...

            case 'storage/unknown':
              // Unknown error occurred, inspect error.serverResponse
              break;
          }
        }, 
        () => {
          // Upload completed successfully, now we can get the download URL
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setMedia(downloadURL);
          });
        }
      );
    };

    file && upload();
  }, [file])

  if(status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  if(status === "unauthenticated") {
    router.push("/")
  }


  const slugify = (str) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    

  const handleSubmit = async() => {
    const res = await fetch("/api/posts", {
      method: "POST",
      body:JSON.stringify({
        title,
        desc: value,
        img: media,
        slug: slugify(title),
        catSlug: "travel"
      }),
    });
    console.log(res);
  }


  
  return (
    <div className={styles.container}>
      <input type="text" placeholder="Title" onChange={e=>setTitle(e.target.value)} />
      <input type="text" placeholder="category" />
      <div className={styles.editor}>
        <button className={styles.button} onClick={() => setOpen(!open)}>
          <Image src="/plus.png" alt="" width={16} height={16} />
        </button>
        {open && <div className={styles.add}>
          <input type="file" id="image" onChange={e => setFile(e.target.files[0])} style={{display: "none"}} />

        <button className={styles.button}>
          <label htmlFor="image">
            <Image src="/image.png" alt="" width={16} height={16} />
          </label>
        </button>
        <button className={styles.button}>
          <Image src="/external.png" alt="" width={16} height={16} />
        </button>
        <button className={styles.button}>
          <Image src="/video.png" alt="" width={16} height={16} />
        </button>
        </div> }
        <ReactQuill className={styles.textArea} theme="bubble" value={value} onChange={setValue} placeholder='Tell your story....' />
      </div>
      <button className={styles.publish} onClick={handleSubmit}>Publish</button>
    </div>
  )
}


export default WritePage