<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Explorer | PHP</title>

    <!-- css -->
    <link rel="stylesheet" href="./assets/styles/main.css">
    <link rel="stylesheet" href="./assets/styles/modal.css">
    <link rel="stylesheet" href="./assets/styles/snackbar.css">

    <!-- jquery -->
    <script src="./assets/scripts/jquery-3.6.0.min.js"></script>
</head>

<body>
    <div class="container">
        <h2 class="headerText">File Explorer</h2>

        <div class="options">
            <!-- options icon -->
            <div class="optionsIcon">
                <span><img src="./assets/images/search.png" alt="" srcset="" title="Search" class="icon iconSearch" style="background: #dae2f1"></span>
                <span><img src="./assets/images/createFile.png" alt="" srcset="" title="Create File" class="icon iconCreateFile"></span>
                <span><img src="./assets/images/createDir.png" alt="" srcset="" title="Create Directory" class="icon iconCreateDir"></span>
                <span><img src="./assets/images/upload.png" alt="" srcset="" title="Upload" class="icon iconUpload"></span>
                <div class="opsIconRight">
                    <span><img src="./assets/images/grid.png" alt="" srcset="" title="List/Grid View" class="icon iconGrid"></span>
                </div>
            </div>
            <!-- options operration div -->
            <div class="optionsOps">
                <!-- serach -->
                <div class="search" style="top: 10px; display: flex;">
                    <span><img src="./assets/images/search.png" alt="" srcset="" title="Search" class="icon iconSearch"></span>
                    <input type="text" name="searchKey" id="searchKey" placeholder="Start typing to search file">
                </div>
                <!-- create File / Dir -->
                <div class="create">
                    <form action="" method="POST" id="createForm">
                        <input type="text" name="create" class="addInput" required>
                        <input type="text" name="fileType" class="fileType" required style="display: none;">
                        <input type="submit" value="Create" name="submit" class="addSubmit">
                    </form>
                </div>
                <!-- uploads -->
                <div class="uploads">
                    <form action="" method="POST" enctype="multipart/form-data" id="uploadForm">
                        <input type="file" name="fileToUpload" id="fileToUpload" class="defaultInputImage">
                        <span id="btnBrowseFile">
                            <img src="./assets/images/upload.png" alt="" srcset="" title="Select File" class="icon iconUpload">
                            <span title="Select File">No file chosen</span>
                        </span>
                        <input type="submit" value="Upload" name="submit" id="btnToUpload" class="defaultInputImage">
                        <span id="btnUpload">
                            <img src="./assets/images/upCloud.png" alt="" srcset="" title="Upload" class="icon iconUpload">
                            <span title="Upload">Upload</span>
                        </span>
                    </form>
                    <div id="uploadResult" style="display: none;">
                        <img src="" alt="" class="icon iconCross">
                        <span></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- You are here -->
        <div class="currDir">
            <span class="cdHeader">You are here:</span>
            <span class="cdText">/</span>
        </div>

        <!-- displaying files -->
        <div class="content"></div>

        <!-- notification snackbar -->
        <div id="snackbar">Some notification text..</div>

        <!-- uploadModal -->
        <div id="uploadModal" class="modal-overlay">
            <div class="modal" style="margin-left: -182px; margin-bottom: -90px;">
                <span class="close">&times;</span>
                <p class="text">File name already exist!<br>Choose an option:</p>
                <p class="textDes">Replace: Existing file will be overwritten with new one</p>
                <div>
                    <button type="button" class="btnMain btnCancel btnCancelReplace">Cancel</button>
                    <input type="submit" value="Replace" class="btnMain btnReplace">
                </div>
                <p class="text"></p>
                <p class="textDes">New Name: Upload file with new name<br>
                    <input type="text" name="customName" id="customName" value="" spellcheck="false">
                </p>
                <div>
                    <button type="button" class="btnMain btnCancel btnCancelNewName">Cancel</button>
                    <input type="submit" value="Upload with New Name" class="btnMain btnNewName">
                </div>
            </div>
        </div>


        <!-- delete modal -->
        <div id="deleteModal" class="modal-overlay">
            <div class="modal">
                <span class="close">&times;</span>
                <p class="text">Please confirm to delete!</p>
                <div>
                    <p id="filePath" style="display: none;"></p>
                    <button type="button" class="btnMain btnCancel">Cancel</button>
                    <input type="submit" value="Delete" class="btnMain btnDelete">
                </div>
            </div>
        </div>

        <!-- rename modal -->
        <div id="renameModal" class="modal-overlay">
            <div class="modal" style="margin-left: -140px; margin-bottom: -60px;">
                <span class="close">&times;</span>
                <form action="" method="post" id="renameForm" style="overflow: hidden;">
                    <input type="text" name="oldName" value="" spellcheck="false" id="oldName" style="display: none;">
                    <input type="text" name="rename" value="" spellcheck="false" id="rename">
                    <p style="margin-bottom: 10px;"></p>
                    <div>
                        <button type="button" class="btnMain btnCancel btnCancelNewName">Cancel</button>
                        <input type="submit" value="Rename" class="btnMain btnRename">
                    </div>
                </form>
            </div>
        </div>

        <!-- download processing modal -->
        <div id="downloadModal" class="modal-overlay">
            <div class="modal">
                <span class="close">&times;</span>
                <img src="./assets/images/zipping.gif" alt="" srcset="">
                <p class="text">Compressing your files for downloading.</p>
                <p class="text">Please Wait...</p>
            </div>
        </div>

        <!-- side bar / batch -->
        <div class="batch">
            <img src="./assets/images/delete.png" alt="" srcset="" title="Delete Marked Items" class="icon iconDeleteMarked" style="margin: 0;">
            <img src="./assets/images/download.png" alt="" srcset="" title="Download Marked Items" class="icon iconDownloadMarked">
        </div>

        <!-- recycle bin -->
        <div class="bin">
            <img src="./assets/images/binEmpty.png" alt="" title="Empty Recycle Bin" srcset="" title="">
            <!-- <img src="./assets/images/binFull.png" alt="" srcset="" title="Recycle Bin"> -->
            <p style="position: fixed;left: -180px;bottom: 80px;transition: all 0.3s;padding: 5px;border: 1px solid #dae2f1;border-radius: 3px;background: #ff4d4d;color: #fff;font-weight: bold;">Not Implemented yet<span class="binSpan" style="margin-left: 5px; border-left: 1px solid; padding: 0px 5px; background: #FFF; color: #ff4d4d; cursor: pointer;">&times;</span></p>
        </div>
    </div>

    <!-- js -->
    <script src="./assets/scripts/main.js"></script>
</body>

</html>