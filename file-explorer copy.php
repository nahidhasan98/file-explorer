<?php

// including required file
include "./common.php";
include "./MyFile.php";

$dir = rootDir;
if (isset($_GET['dir']) && $_GET['dir'] != "") $dir = rootDir . DIRECTORY_SEPARATOR . $_GET['dir'];

$fileNames = scandir($dir);
$myFilesSorted = organizeFiles($dir, $fileNames);

?>

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
    <div class="content">
        <h2 class="headerText">File Explorer</h2>

        <div class="options" style="height: 100px;">
            <div class="optionsIcon">
                <img src="./assets/images/search.png" alt="" srcset="" title="Search" class="icon iconSearch">
                <img src="./assets/images/createFile.png" alt="" srcset="" title="Create File" class="icon iconCreate">
                <img src="./assets/images/createDir.png" alt="" srcset="" title="Create Directory" class="icon iconCreate">
                <img src="./assets/images/upload.png" alt="" srcset="" title="Upload" class="icon iconUpload">
            </div>
            <!-- uploads -->
            <div class="optionsOps">
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

        <!-- <div class="create">
            <span style="display: none;" class="formSpan">
                <form action="" method="POST" id="addForm">
                    <input type="text" name="create" class="addInput" required>
                    <input type="text" name="fileType" id="fileType" required style="display: none;">
                    <input type="submit" value="Create" name="submit" class="addSubmit">
                </form>
            </span>
            <img src="./assets/images/rightArrow.png" alt="" class="icon iconRightArrow" style="display: none;">
        </div> -->

        <!-- You are here -->
        <div class="currDir">
            <span class="cdHeader">You are here:</span>
            <span class="cdText"><?php echo "/" . str_replace(rootDir, "root", $dir); ?></span>
        </div>

        <!-- table -->
        <table class="feTable">
            <tr>
                <th style="width: 3%;"></th>
                <th class="sortByName">
                    Name
                    <img src="./assets/images/sUp.png" alt="" srcset="" class="icon iconSort" id="nameUp" style="display: none;">
                    <img src="./assets/images/sDown.png" alt="" srcset="" class="icon iconSort" id="nameDown" style="display: none;">
                </th>
                <th colspan="2" style="width: 12%;" class="sortBySize">
                    Size
                    <img src="./assets/images/sUp.png" alt="" srcset="" class="icon iconSort" id="sizeUp" style="display: none;">
                    <img src="./assets/images/sDown.png" alt="" srcset="" class="icon iconSort" id="sizeDown" style="display: none;">
                </th>
                <th style="width: 15%;">Options</th>
            </tr>

            <?php

            $id = 0;
            foreach ($myFilesSorted as $myFile) {
                if ($myFile->name == ".") continue;

                $iconLink = getExtensionIconPath($myFile->getExtension());

                echo '<tr id="' . ++$id . '">';

                // check box
                if ($myFile->isDir()) echo '<td></td>';
                else echo '<td><input type="checkbox" class="checkbox"></td>';

                // file icon
                echo '<td><img src="' . $iconLink . '" alt="" srcset="" class="icon iconExt">';

                // file name with link
                if ($myFile->isDir()) echo '<a href="' . getDirLink($myFile) . '" class="dir">' . $myFile->name . '</a>';
                else echo '<span class="file">' . $myFile->name . '</span></td>';

                // file size
                if ($myFile->isDir()) {
                    echo '<td colspan="2" style="border-right: 1px solid #dae2f1;">Folder</td>';
                } else {
                    echo "<td>" . $myFile->getFormattedSize()["size"] . "</td>";
                    echo "<td>" . $myFile->getFormattedSize()["unit"] . "</td>";
                }

                // delete icon
                echo '<td>';
                if ($myFile->name != "..")
                    echo '<img src="./assets/images/delete.png" alt="delete" srcset="" title="Delete" class="icon iconDelete">';

                // download icon
                if (!$myFile->isDir())
                    echo '<img src="./assets/images/download.png" alt="download" srcset="" title="Download" class="icon iconDownload">';

                // rename icon
                if ($myFile->name != "..")
                    echo '<img src="./assets/images/rename.png" alt="Rename" srcset="" title="Rename" class="icon iconRename">';

                echo '</td></tr>';
            }
            ?>
        </table>

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
                    <p id="currSerial" style="display: none;"></p>
                    <p id="fileName" style="display: none;"></p>
                    <p id="fromDir" style="display: none;"></p>
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
    </div>

    <!-- js -->
    <script src="./assets/scripts/main.js"></script>
</body>

</html>