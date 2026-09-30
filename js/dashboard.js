// ======================================
// CLOUD DRIVE DASHBOARD
// ======================================

let currentUser = null;
let allFiles = [];


// ======================================
// CHECK LOGIN
// ======================================

async function checkUser() {

    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();


    if (!user) {

        window.location.href = "index.html";

        return;
    }


    currentUser = user;


    document.getElementById("userEmail").textContent =
        user.email;


    loadFiles();
}


// ======================================
// LOAD SHARED FILES
// ======================================

async function loadFiles() {

    const container =
        document.getElementById("filesContainer");


    container.innerHTML =
        `<div class="loading">Loading files...</div>`;


    const {
        data,
        error
    } = await supabaseClient
        .from("files")
        .select("*")
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        container.innerHTML =
            `<div class="error">
                Failed to load files.
             </div>`;

        return;
    }


    allFiles = data || [];

    displayFiles(allFiles);
}


// ======================================
// DISPLAY FILES
// ======================================

function displayFiles(files) {

    const container =
        document.getElementById("filesContainer");


    if (!files.length) {

        container.innerHTML =
            `<div class="empty">
                📂 No files uploaded yet.
             </div>`;

        return;
    }


    container.innerHTML = "";


    files.forEach(file => {

        const card =
            document.createElement("div");


        card.className = "file-card";


        const icon =
            getFileIcon(file.file_name);


        card.innerHTML = `

            <div class="file-icon">
                ${icon}
            </div>

            <div class="file-info">

                <h3>
                    ${escapeHTML(file.file_name)}
                </h3>

                <p>
                    ${formatSize(file.file_size)}
                </p>

                <small>
                    Uploaded:
                    ${new Date(file.created_at).toLocaleString()}
                </small>

            </div>

            <div class="file-actions">

                <button
                    onclick="downloadFile('${encodeURIComponent(file.file_path)}')"
                >
                    📥 Download
                </button>

                ${
                    file.user_id === currentUser.id
                    ?
                    `
                    <button
                        class="delete-btn"
                        onclick="deleteFile('${file.id}', '${encodeURIComponent(file.file_path)}')"
                    >
                        🗑️
                    </button>
                    `
                    :
                    ""
                }

            </div>
        `;


        container.appendChild(card);

    });
}


// ======================================
// UPLOAD FILE
// ======================================

async function uploadFile(file) {

    if (!file) return;


    if (!currentUser) {

        alert("Please login first.");

        return;
    }


    const status =
        document.getElementById("uploadStatus");


    status.textContent =
        "Uploading...";


    /*
        Create unique path

        USER_ID / TIMESTAMP_FILENAME
    */

    const safeName =
        file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );


    const filePath =
        `${currentUser.id}/${Date.now()}_${safeName}`;


    // Upload to Supabase Storage

    const {
        error: uploadError
    } = await supabaseClient
        .storage
        .from("user-files")
        .upload(
            filePath,
            file
        );


    if (uploadError) {

        console.error(uploadError);

        status.textContent =
            "Upload failed.";

        alert(uploadError.message);

        return;
    }


    // Save file information in database

    const {
        error: dbError
    } = await supabaseClient
        .from("files")
        .insert({

            user_id: currentUser.id,

            file_name: file.name,

            file_path: filePath,

            file_size: file.size,

            mime_type: file.type

        });


    if (dbError) {

        console.error(dbError);

        status.textContent =
            "File uploaded but database record failed.";

        return;
    }


    status.textContent =
        "✅ Upload successful!";


    document.getElementById("fileInput").value = "";

    document.getElementById("fileInput2").value = "";


    await loadFiles();

}


// ======================================
// DOWNLOAD FILE
// ======================================

async function downloadFile(encodedPath) {

    const path =
        decodeURIComponent(encodedPath);


    const {
        data,
        error
    } = await supabaseClient
        .storage
        .from("user-files")
        .download(path);


    if (error) {

        console.error(error);

        alert("Download failed.");

        return;
    }


    const url =
        URL.createObjectURL(data);


    const a =
        document.createElement("a");


    a.href = url;

    a.download =
        path.split("/").pop();


    document.body.appendChild(a);

    a.click();

    a.remove();


    URL.revokeObjectURL(url);
}


// ======================================
// DELETE FILE
// ======================================

async function deleteFile(
    id,
    encodedPath
) {

    if (
        !confirm(
            "Delete this file?"
        )
    ) {

        return;
    }


    const path =
        decodeURIComponent(encodedPath);


    const {
        error: storageError
    } = await supabaseClient
        .storage
        .from("user-files")
        .remove([
            path
        ]);


    if (storageError) {

        alert(
            storageError.message
        );

        return;
    }


    const {
        error: dbError
    } = await supabaseClient
        .from("files")
        .delete()
        .eq(
            "id",
            id
        );


    if (dbError) {

        alert(
            dbError.message
        );

        return;
    }


    loadFiles();
}


// ======================================
// SEARCH
// ======================================

document
    .getElementById("searchInput")
    .addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .toLowerCase()
                    .trim();


            const filtered =
                allFiles.filter(
                    file =>
                        file.file_name
                            .toLowerCase()
                            .includes(search)
                );


            displayFiles(filtered);

        }
    );


// ======================================
// FILE INPUTS
// ======================================

document
    .getElementById("fileInput")
    .addEventListener(
        "change",
        function () {

            uploadFile(
                this.files[0]
            );

        }
    );


document
    .getElementById("fileInput2")
    .addEventListener(
        "change",
        function () {

            uploadFile(
                this.files[0]
            );

        }
    );


// ======================================
// LOGOUT
// ======================================

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        async function () {

            await supabaseClient
                .auth
                .signOut();


            window.location.href =
                "index.html";

        }
    );


// ======================================
// HELPERS
// ======================================

function formatSize(bytes) {

    if (bytes === 0)
        return "0 Bytes";


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"
    ];


    const i =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        (bytes /
            Math.pow(1024, i))
            .toFixed(2)
        +
        " " +
        units[i]
    );
}


function getFileIcon(name) {

    const ext =
        name
            .split(".")
            .pop()
            .toLowerCase();


    if (
        ["jpg", "jpeg", "png", "gif", "webp"]
            .includes(ext)
    )
        return "🖼️";


    if (
        ["mp4", "mkv", "avi", "mov"]
            .includes(ext)
    )
        return "🎬";


    if (
        ["mp3", "wav"]
            .includes(ext)
    )
        return "🎵";


    if (
        ["pdf"]
            .includes(ext)
    )
        return "📕";


    if (
        ["zip", "rar", "7z"]
            .includes(ext)
    )
        return "📦";


    if (
        ["html", "css", "js", "json"]
            .includes(ext)
    )
        return "💻";


    return "📄";
}


function escapeHTML(value) {

    return value
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// Start

checkUser();