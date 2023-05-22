import { useRef, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { FaUpload } from 'react-icons/fa';

const ProfileImageCropper = ({ onUpload }) => {
    const inputFileRef = useRef();
    const imageRef = useRef();
    const [cropper, setCropper] = useState(null);
    const [imageChosen, setImageChosen] = useState(false);
    const handleUploadProfilePicture = (e) => {
        e.preventDefault();

        const file = e.target.files[0];

        const createImageCropper = (url) => {
            imageRef.current.src = url;
            imageRef.current.style.display = 'block';

            if (cropper) {
                cropper.destroy();
            }

            const newCropper = new Cropper(imageRef.current, {
                aspectRatio: 1,
                viewMode: 1,
            });

            setCropper(newCropper);

        };

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                createImageCropper(reader.result);
            };
            reader.readAsDataURL(file);
        }
        if (file) {
            setImageChosen(true);
        } else {
            setImageChosen(false);
        }
    };

    const handleUploadCroppedImage = async () => {
        if (!cropper) return;

        const croppedDataURL = cropper.getCroppedCanvas().toDataURL();
        onUpload(croppedDataURL);
    };

    return (
        <div>

            <div className="max-h-[300px] overflow-auto">
                <input
                    ref={inputFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadProfilePicture}
                    className="hidden"
                />

                <img
                    id="image"
                    ref={imageRef}
                    src="#"
                    alt="Profile Picture"
                    style={{ display: 'none' }}
                />


            </div>
            <div className='flex justify-center place-center'>
                <button
                    onClick={() => inputFileRef.current.click()}
                    className="mt-5 text-white bg-gradient-to-br from-pink-500 to-orange-400 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
                >
                    Upload picture
                </button>
                {imageChosen && (
                    <button className='mt-5 text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2' onClick={handleUploadCroppedImage}>Save changes</button>
                )}</div>
        </div>

    );
};
export default ProfileImageCropper;