console.log("scripts connected successfully");

const colorSuccess = "#00b359";
const colorError = "#ff4d4d";
let sortByNameAsc = true;
let sortBySizeAsc = false;
let sortByModifiedTimeAsc = false;
let currentOngoingRequest = false;
let checkboxes = [];
let totalSelectableItems = 0;
let fileList = [];

$(document).ready(function () {
    let currView = sessionStorage.getItem("viewStyle");
    getAndDisplayFileList(currView);

    $(".iconGrid").on("click", function () {
        let currView = sessionStorage.getItem("viewStyle");

        if (currView == "grid") {
            displayFileList(fileList, "list");
            sessionStorage.setItem("viewStyle", "list");
            $(".iconGrid").css("background", "");
        } else {
            displayFileList(fileList, "grid");
            sessionStorage.setItem("viewStyle", "grid");
            $(".iconGrid").css("background", "#dae2f1");
        }
    });

    $(".iconSearch").on("click", function () {
        hideAllOps();
        $(".search").css("top", "10px");
        $(".optionsIcon .iconSearch").css("background", "#dae2f1");
        $(".search input").focus();
    });

    $("#searchKey").on("keyup", function () {
        let filter = $("#searchKey").val().toUpperCase().trim();
        let items = $(".fileName");

        // Loop through all items, and hide those who don't match the search query
        for (i = 0; i < items.length; i++) {
            let itemText = $(items[i]).text().toUpperCase().trim();

            let elem = $(items[i]).parent().parent();
            let currView = sessionStorage.getItem("viewStyle");
            if (currView == "list" && elem.attr("id") == undefined) elem = $(items[i]).parent().parent().parent();  // in list view, hideable directory item reside in one level deep

            if (itemText.indexOf(filter) > -1) elem.css("display", "");
            else elem.css("display", "none");
        }
    });

    $(".iconCreateFile").on("click", function () {
        hideAllOps();
        $(".create").css("top", "10px");
        $(".iconCreateFile").css("background", "#dae2f1");
        $(".fileType").val("file");
        $(".addInput").attr("placeholder", "Enter file name");
        $(".addInput").focus();
    });

    $(".iconCreateDir").on("click", function () {
        hideAllOps();
        $(".create").css("top", "10px");
        $(".iconCreateDir").css("background", "#dae2f1");
        $(".fileType").val("directory");
        $(".addInput").attr("placeholder", "Enter directory name");
        $(".addInput").focus();
    });

    $(".iconUpload").on("click", function () {
        hideAllOps();
        $(".uploads").css("top", "10px");
        $(".optionsIcon .iconUpload").css("background", "#dae2f1");
    });

    $("#createForm").on('submit', function (e) {
        e.preventDefault();
        let currDir = $(".currDir .cdText").text().trim();

        if ($(".addInput").val().trim().length == 0) {
            $(".addInput").val("");
            return false;
        }

        let formData = $("#createForm").serializeArray();
        formData.push({ name: 'currDir', value: currDir });
        formData.find(function (input) { return input.name == 'create'; }).value = $(".addInput").val().trim(); // overwrite cause we need to trim

        createFileOrDir(formData);
        return false;
    });

    $("body").on("click", ".iconDelete", function () {
        let currDir = $(".currDir .cdText").text().trim();
        let fileName = $(this).parent().parent().find(".fileName").text().trim();
        let filePath = currDir + "/" + fileName;

        $("#filePath").text(filePath);
        console.log(filePath);
        displayDeleteModal();
        // further process of delete will trigger from modal button clicked
    });

    $("body").on("click", ".btnDelete", function () {
        if (checkboxes.length == 0) {
            let filePath = $("#filePath").text().trim();

            deleteFile(filePath);
        } else {
            deleteBatch();
        }
    });

    $(".close").on("click", function () {
        hideDeleteModal();
        hideUploadModal();
        hideDownloadModal();
        hideRenameModal();
    });

    $(".btnCancel").on("click", function () {
        hideDeleteModal();
        hideRenameModal();
    });

    $(".btnCancelReplace, .btnCancelNewName").on("click", function () {
        if (currentOngoingRequest) {
            currentOngoingRequest.abort();
            currentOngoingRequest = false;
        } else hideUploadModal();

        $(".btnReplace").val("Replace");
        $(".btnNewName").val("Upload with New Name");
        $('.btnReplace, .btnNewName, .btnCancelReplace, .btnCancelNewName').css({ "opacity": "", 'pointer-events': "" });
    });

    $('#btnBrowseFile').on("click", function () {
        $("#fileToUpload").trigger("click");
    });

    $("#fileToUpload").on("change", function () {
        let selectedFileName = $("#fileToUpload").val().replace(/C:\\fakepath\\/i, '');
        // console.log(selectedFileName);
        if (selectedFileName == "")
            $("#btnBrowseFile span").text("No file chosen");
        else
            $("#btnBrowseFile span").text("Selected file: " + selectedFileName);

        hideUploadResult();
    });

    $('#btnUpload').on("click", function () {
        $('#btnToUpload').trigger('click');
    });

    $("#uploadForm").on('submit', function (e) {
        e.preventDefault();
        let files = $('#fileToUpload').prop('files');
        let currDir = $(".currDir .cdText").text().trim();

        uploadFile(currDir, files, "", "false");
        return false;
    });

    $(".btnReplace").on("click", function () {
        let files = $('#fileToUpload').prop('files');
        let currDir = $(".currDir .cdText").text().trim();

        $(".btnReplace").val("Replacing...");
        $('.btnReplace, .btnCancelNewName, .btnNewName').css({ "opacity": ".7", 'pointer-events': "none" });

        uploadFile(currDir, files, "", "true");
    });

    $(".btnNewName").on("click", function () {
        let files = $('#fileToUpload').prop('files');
        let currDir = $(".currDir .cdText").text().trim();
        let customName = $("#customName").val().trim();

        $(".btnNewName").val("Uploading...");
        $('.btnNewName, .btnReplace, .btnCancelReplace').css({ "opacity": ".7", 'pointer-events': "none" });

        uploadFile(currDir, files, customName, "custom");
    });

    $("body").on("click", ".iconDownload", function () {
        let currDir = $(".currDir .cdText").text().trim();
        let fileName = $(this).parent().parent().find(".fileName").text().trim();
        let filePath = currDir + "/" + fileName;
        downloadFile(filePath);
    });

    $("body").on("click", ".iconRename", function () {
        let currDir = $(".currDir .cdText").text().trim();
        let fileName = $(this).parent().parent().find(".fileName").text().trim();
        let filePath = currDir + "/" + fileName;
        console.log(filePath);

        $("#oldName").val(filePath);
        $("#rename").val(fileName); // setting up only file name(rather fullPath) because, rename field only should contain new name(not fullPath)

        displayRenameModal();

        // setting up cursor position on rename field
        let idx = fileName.lastIndexOf(".");
        if (idx == -1) idx = fileName.length;
        $("#rename").focus();
        $("#rename").setCursorPosition(idx);
        // further process of rename will trigger from modal button clicked
    });

    $("#renameForm").on("submit", function () {
        renameFile();
        return false;
    });

    $("body").on("click", ".sortByName", function () {
        sortByName($('.feTable'), !sortByNameAsc);
        sortByNameAsc = !sortByNameAsc;

        if (sortByNameAsc) {
            $("#nameDown").css("display", "");
            $("#nameUp, #sizeUp, #sizeDown, #modifiedTimeUp, #modifiedTimeDown").css("display", "none");
        } else {
            $("#nameUp").css("display", "");
            $("#nameDown, #sizeUp, #sizeDown, #modifiedTimeUp, #modifiedTimeDown").css("display", "none");
        }
    });

    $("body").on("click", ".sortBySize", function () {
        sortBySize($('.feTable'), !sortBySizeAsc);
        sortBySizeAsc = !sortBySizeAsc;

        if (sortBySizeAsc) {
            $("#sizeDown").css("display", "");
            $("#sizeUp, #nameUp, #nameDown, #modifiedTimeUp, #modifiedTimeDown").css("display", "none");
        } else {
            $("#sizeUp").css("display", "");
            $("#sizeDown, #nameUp, #nameDown, #modifiedTimeUp, #modifiedTimeDown").css("display", "none");
        }
    });

    $("body").on("click", ".sortByModifiedTime", function () {
        sortByModifiedTime($('.feTable'), !sortByModifiedTimeAsc);
        sortByModifiedTimeAsc = !sortByModifiedTimeAsc;

        if (sortByModifiedTimeAsc) {
            $("#modifiedTimeDown").css("display", "");
            $("#modifiedTimeUp, #nameUp, #nameDown, #sizeUp, #sizeDown").css("display", "none");
        } else {
            $("#modifiedTimeUp").css("display", "");
            $("#modifiedTimeDown, #nameUp, #nameDown, #sizeUp, #sizeDown").css("display", "none");
        }
    });

    $("body").on("click", ".checkboxSingle", function () {
        let currDir = $(".currDir .cdText").text().trim();
        let fileName = $(this).parent().parent().find(".fileName").text().trim();
        let filePath = currDir + "/" + fileName;

        if ($(this).is(":checked")) {
            checkboxes.push(filePath);
        } else {
            checkboxes = $.grep(checkboxes, function (item) {
                return item != filePath;
            });
        }

        console.log(checkboxes);

        if (checkboxes.length > 0) {
            $(".batch").css("left", "0");
            $(".iconDelete, .iconDownload, .iconRename").css({ "opacity": "0.6", "pointer-events": "none" });
        } else {
            $(".batch").css("left", "-60px");
            $(".iconDelete, .iconDownload, .iconRename").css({ "opacity": "", "pointer-events": "" });
        }

        // taking care of master checkbox
        if (checkboxes.length > 0 && checkboxes.length == totalSelectableItems) $("#checkboxMaster").prop('checked', true);
        else $("#checkboxMaster").prop('checked', false);
    });

    $("body").on("click", "#checkboxMaster", function () {
        let isSelected = $(this).is(":checked");

        if (isSelected) selectAllItems();
        else unSelectAllItems();

        console.log(checkboxes);
        if (checkboxes.length > 0) {
            $(".batch").css("left", "0");
            $(".iconDelete, .iconDownload, .iconRename").css({ "opacity": "0.6", "pointer-events": "none" });
        } else {
            $(".batch").css("left", "-60px");
            $(".iconDelete, .iconDownload, .iconRename").css({ "opacity": "", "pointer-events": "" });
        }
    });

    $(".iconDownloadMarked").on("click", function () {
        downloadBatch();
    });

    $(".iconDeleteMarked").on("click", function () {
        displayDeleteModal();
    });

    $(".bin").on("click", function () {
        $(".bin p").css("left", "18px");
    });

    $(".binSpan").on("click", function () {
        setTimeout(function () {
            $(".bin p").css("left", "-180px");
        }, 1);
    });
});

function hideAllOps() {
    $(".search, .create, .uploads").css("top", "-38px");
    $(".iconSearch, .iconCreateFile, .iconCreateDir, .iconUpload").css("background", "");
}

function selectAllItems() {
    checkboxes = [];
    let currDir = $(".currDir .cdText").text().trim();

    $(".feTable tr").each(function () {
        let iconLink = $(this).find("td:eq(1) img").attr("src");
        if (typeof iconLink == "string" && (!iconLink.endsWith("dir.png") && !iconLink.endsWith("return.png"))) {
            let fileName = $(this).find("td:eq(1)").text().trim();
            let filePath = currDir + "/" + fileName;

            $(this).find("td:eq(0) input").prop('checked', true);
            checkboxes.push(filePath);
        }
    });
}

function unSelectAllItems() {
    $(".feTable tr").each(function () {
        $(this).find("td:eq(0) input").prop('checked', false);
    });
    checkboxes = [];
}

function createFileOrDir(formData) {
    $('#addSubmit').css({ "opacity": ".7", "pointer-events": "none" });
    $('#addSubmit').val("Creating...");

    // sending ajax post request
    let request = $.ajax({
        type: "POST",
        url: "create.php",
        data: formData,
        dataType: "json",
    });
    request.done(function (response) {
        // console.log(response);
        if (response.status == "success") {
            $(".addInput").val("");
            notify(response.message, 3, colorSuccess);

            // refreshing file list
            refreshFileList();
        } else {
            notify(response.message, 3, colorError);
        }
    });
    request.fail(function (response) {
        console.log("something went wrong");
        console.log(response);
    });
    request.always(function () {
        $('#addSubmit').css({ "opacity": "", "pointer-events": "" });
        $('#addSubmit').val("Create");
    });
}

function deleteFile(filePath) {
    $('.btnDelete').css({ "opacity": ".7", "pointer-events": "none" });
    $('.btnDelete').val("Deleting...");

    let data = { fileToDelete: filePath };

    // sending ajax post request
    let request = $.ajax({
        type: "POST",
        url: "delete.php",
        data: JSON.stringify(data),
        dataType: "json",
    });
    request.done(function (response) {
        console.log(response);
        if (response.status == "success") {
            notify(response.message, 3, colorSuccess);

            // refreshing file list
            refreshFileList();
        } else {
            notify(response.message, 3, colorError);
        }
    });
    request.fail(function (response) {
        console.log("something went wrong");
        console.log(response);
    });
    request.always(function () {
        $('.btnDelete').css({ "opacity": "", "pointer-events": "" });
        $('.btnDelete').val("Delete");

        hideDeleteModal();
    });
}

function deleteBatch() {
    $('.btnDelete').css({ "opacity": ".7", "pointer-events": "none" });
    $('.btnDelete').val("Deleting...");

    let data = { fileToDelete: checkboxes };

    // sending ajax post request
    let request = $.ajax({
        type: "POST",
        url: "delete.php",
        data: JSON.stringify(data),
        dataType: "json",
    });
    request.done(function (response) {
        console.log(response);
        if (response.status == "success") {
            notify(response.message, 3, colorSuccess);
            refreshFileList();
            checkboxes = [];
            $(".batch").css("left", "-60px");
            $(".iconDelete, .iconDownload").css({ "opacity": "", "pointer-events": "" });
        } else {
            notify(response.message, 3, colorError);
        }
    });
    request.fail(function (response) {
        console.log("something went wrong");
        console.log(response);
    });
    request.always(function () {
        $('.btnDelete').css({ "opacity": "", "pointer-events": "" });
        $('.btnDelete').val("Delete");

        hideDeleteModal();
    });
}

function uploadFile(currDir, files, customName, replaceType) {
    let file = files[0];
    if (files.length == 0) {
        displayUploadResult("./assets/images/cross.png", "Error: Please select a file then press upload.", colorError);
        return false;
    }

    $('#btnUpload, #btnBrowseFile').css({ "opacity": ".7", "pointer-events": "none" });
    $('#btnUpload img').attr("src", "./assets/images/uploading.gif");
    $('#btnUpload span').text("Uploading...");

    // first checking if file already exist or not
    let isExist = false, responseFileName;
    if (replaceType != "true") { // if replaceType is true, should replace(no need to check for existance)
        let url = "upload.php?todo=check&currDir=" + currDir + "&file=" + file.name;;
        if (customName != "") url = "upload.php?todo=check&currDir=" + currDir + "&file=" + customName;

        $.ajax({
            async: false,
            type: "GET",
            url: url,
            dataType: "json",
        }).done(function (response) {
            console.log(response);
            if (response.status == "success" && response.message == true) {
                responseFileName = response.fileName;
                isExist = true;
            }
        }).fail(function (response) {
            console.log("something went wrong");
            console.log(response);
        });
    }

    if (isExist) {
        // open interactive modal
        displayUploadModal();
        console.log(currentOngoingRequest);

        $(".btnReplace").val("Replace");
        $(".btnNewName").val("Upload with New Name");
        $('.btnReplace, .btnNewName, .btnCancelReplace, .btnCancelNewName').css({ "opacity": "", "pointer-events": "" });

        let idx = responseFileName.lastIndexOf(".");
        if (idx == -1) idx = responseFileName.length;
        let cName = responseFileName.substring(0, idx) + "_copy" + responseFileName.substring(idx);

        $("#customName").val(cName);
        $("#customName").focus();
        $("#customName").setCursorPosition(idx + 5); // 5 for _copy
    } else {
        let formData = new FormData();
        formData.append('fileToUpload', file);
        formData.append('currDir', currDir);
        formData.append('customName', customName);
        formData.append('replaceType', replaceType);
        // Display the key/value pairs
        for (var pair of formData.entries()) {
            console.log(pair[0]);
            console.log(pair[1]);
        }

        // sending ajax post request
        let request = $.ajax({
            type: "POST",
            url: "upload.php",
            data: formData,
            dataType: "json",
            contentType: false,
            cache: false,
            processData: false,
        });
        request.done(function (response) {
            console.log(response);
            if (response.status == "success") {
                $('#uploadForm')[0].reset();
                $("#btnBrowseFile span").text("No file chosen");
                notify("File uploaded successfully", 3, colorSuccess);
                displayUploadResult("./assets/images/tick.png", response.message, colorSuccess)

                if (replaceType != "true") {
                    // refreshing file list
                    refreshFileList();
                }

                hideUploadModal();
            } else if (response.type == "duplicate") {
                // open interactive modal
                displayUploadModal();

                let idx = response.fileName.lastIndexOf(".");
                if (idx == -1) idx = response.fileName.length;
                let cName = response.fileName.substring(0, idx) + "_copy" + response.fileName.substring(idx);

                $("#customName").val(cName);
                $("#customName").focus();
                $("#customName").setCursorPosition(idx + 5); // 5 for _copy
            } else {
                notify("File upload unsuccessful", 3, colorError);
                displayUploadResult("./assets/images/cross.png", response.message, colorError)
                hideUploadModal();
            }
        });
        request.fail(function (response) {
            console.log("something went wrong");
            console.log(response);
        });
        request.always(function () {
            $('#btnUpload, #btnBrowseFile').css({ "opacity": "", "pointer-events": "" });
            $('#btnUpload img').attr("src", "./assets/images/upCloud.png");
            $('#btnUpload span').text("Upload");
        });
        currentOngoingRequest = request;
    }
}

function downloadFile(filePath) {
    let downloadURL = "download.php?fileToDownload=" + encodeURIComponent(filePath);
    window.location = downloadURL;
}

function downloadBatch() {
    let params = checkboxes.map(function (item) {
        return encodeURIComponent(item);
    }).join(",");

    let compressURL = "download.php?fileToDownload=" + params + "&todo=compress";
    let downloadURL = "download.php?fileToDownload=" + params + "&todo=download";
    displayDownloadModal();

    $.ajax({
        type: "GET",
        url: compressURL,
        dataType: "json",
    }).done(function (response) {
        // console.log(response);
        if (response.status == "ok") {
            hideDownloadModal();
            window.location = downloadURL;
        }
    }).fail(function (response) {
        console.log("something went wrong");
        console.log(response);
    });
}

function displayUploadResult(imgSrc, errText, color) {
    $("#uploadResult").css("display", "");
    $("#uploadResult img").attr("src", imgSrc);
    $("#uploadResult span").text(errText);
    $("#uploadResult span").css("color", color);
    $(".optionsOps").css("height", "56px");
}

function hideUploadResult() {
    $("#uploadResult").css("display", "none");
    $(".optionsOps").css("height", "38px");
}

function notify(message, time, bgColor) {
    let sBar = $("#snackbar");

    sBar.text(message);
    sBar.css("background", bgColor);
    sBar.addClass("show");

    // After 3 seconds, remove the show class from DIV
    setTimeout(function () {
        sBar.removeClass("show");
    }, time * 1000);
}

function displayDeleteModal() {
    let modal = $("#deleteModal");
    modal.css("display", "block");
}

function hideDeleteModal() {
    let modal = $("#deleteModal");
    modal.css("display", "none");
}

function displayDownloadModal() {
    let modal = $("#downloadModal");
    modal.css("display", "block");
}

function hideDownloadModal() {
    let modal = $("#downloadModal");
    modal.css("display", "none");
}

function displayUploadModal() {
    let modal = $("#uploadModal");
    modal.css("display", "block");
}

function hideUploadModal() {
    let modal = $("#uploadModal");
    modal.css("display", "none");

    $('#btnUpload, #btnBrowseFile').css({ "opacity": "", "pointer-events": "" });
    $('#btnUpload img').attr("src", "./assets/images/upCloud.png");
    $('#btnUpload span').text("Upload");
}

function displayRenameModal() {
    let modal = $("#renameModal");
    modal.css("display", "block");
}

function hideRenameModal() {
    let modal = $("#renameModal");
    modal.css("display", "none");
}

$.fn.setCursorPosition = function (pos) {
    this.each(function (index, elem) {
        if (elem.setSelectionRange) {
            elem.setSelectionRange(pos, pos);
        } else if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    });
    return this;
}

function getFinalDirIdx(table) {
    let tbody = table.find('tbody');
    let totalRows = tbody.find('tr').length;

    let startIdx = 3; // 1->heading-tr, 2->return-tr, 3->starting directory-tr

    for (let i = startIdx; i <= totalRows; i++) { // tr 1-indexed
        let iconLink = tbody.find('tr:nth-child(' + i + ')').find('td:nth-child(2)').find("img").attr("src");
        if (!iconLink.endsWith("dir.png")) {    // started file tr/row
            startIdx = i - 1;
            break;
        }
    }
    return startIdx;
}

function sortByName(table, isAsc) {
    let tbody = table.find('tbody');

    let rangeIdx = getFinalDirIdx(table) - 2;  // tr 0-indexed
    let totalRows = tbody.find('tr').length;

    // directory sorting
    tbody.find('tr:gt(1)tr:lt(' + rangeIdx + ')').sort(function (a, b) {
        let aFileName = $('td:nth-child(2)', a).text();
        let bFileName = $('td:nth-child(2)', b).text();

        if (isAsc) return aFileName.localeCompare(bFileName);
        else return bFileName.localeCompare(aFileName);
    }).appendTo(tbody);

    // file sorting
    tbody.find('tr:gt(1)tr:lt(' + (totalRows - rangeIdx - 2) + ')').sort(function (a, b) {
        let aFileName = $('td:nth-child(2)', a).text();
        let bFileName = $('td:nth-child(2)', b).text();

        if (isAsc) return aFileName.localeCompare(bFileName);
        else return bFileName.localeCompare(aFileName);
    }).appendTo(tbody);
}

function sortBySize(table, isAsc) {
    let tbody = table.find('tbody');

    let rangeIdx = getFinalDirIdx(table) - 2;
    let totalRows = tbody.find('tr').length;

    // directory sorting
    tbody.find('tr:gt(1)tr:lt(' + rangeIdx + ')').sort(function (a, b) {
        let aSizeText = $('td:nth-child(3)', a).text();
        let bSizeText = $('td:nth-child(3)', b).text();
        let aFileName = $('td:nth-child(2)', a).text();
        let bFileName = $('td:nth-child(2)', b).text();

        if (isAsc) return ((aSizeText * 1) - (bSizeText * 1)) || (aFileName.localeCompare(bFileName));  // sort by size then name-Asc
        else return ((bSizeText * 1) - (aSizeText * 1)) || (aFileName.localeCompare(bFileName));
    }).appendTo(tbody);

    // file sorting
    tbody.find('tr:gt(1)tr:lt(' + (totalRows - rangeIdx - 2) + ')').sort(function (a, b) {
        let aSizeText = $('td:nth-child(3)', a).text();
        let bSizeText = $('td:nth-child(3)', b).text();
        let aSizeUnit = $('td:nth-child(4)', a).text();
        let bSizeUnit = $('td:nth-child(4)', b).text();
        let aFileName = $('td:nth-child(2)', a).text();
        let bFileName = $('td:nth-child(2)', b).text();
        let aSize, bSize;

        if (aSizeUnit == "bytes") aSize = 1.0;
        else if (aSizeUnit == "kB") aSize = 1024.0;
        else if (aSizeUnit == "MB") aSize = 1024.0 * 1024.0;
        else if (aSizeUnit == "GB") aSize = 1024.0 * 1024.0 * 1024.0;

        if (bSizeUnit == "bytes") bSize = 1.0;
        else if (bSizeUnit == "kB") bSize = 1024.0;
        else if (bSizeUnit == "MB") bSize = 1024.0 * 1024.0;
        else if (bSizeUnit == "GB") bSize = 1024.0 * 1024.0 * 1024.0;

        if (isAsc) return ((aSizeText * aSize) - (bSizeText * bSize)) || (aFileName.localeCompare(bFileName));  // sort by size then name-Asc
        else return ((bSizeText * bSize) - (aSizeText * aSize)) || (aFileName.localeCompare(bFileName));
    }).appendTo(tbody);
}

function sortByModifiedTime(table, isAsc) {
    let returnDir;

    // seperating dir & file list
    let tempDirList = [], tempFileList = [];
    for (let i = 0; i < fileList.length; i++) {
        if (fileList[i].fileName == "..") {
            returnDir = fileList[i];
            continue;
        }

        if (fileList[i].isDir) tempDirList.push(fileList[i]);
        else tempFileList.push(fileList[i]);
    }

    // directory sorting
    tempDirList.sort(function (a, b) {
        if (isAsc) return a.lastModified - b.lastModified;
        else return b.lastModified - a.lastModified;
    });

    // file sorting
    tempFileList.sort(function (a, b) {
        if (isAsc) return a.lastModified - b.lastModified;
        else return b.lastModified - a.lastModified;
    });

    // merging two array
    let total = [returnDir, ...tempDirList, ...tempFileList];

    // displaying list
    let currView = sessionStorage.getItem("viewStyle");
    displayFileList(total, currView);
}

function renameFile() {
    $('.btnRename').css({ "opacity": ".7", "pointer-events": "none" });
    $('.btnRename').val("Renaming...");

    let currDir = $(".currDir .cdText").text().trim();

    let oldName = $("#oldName").val().trim();
    let rename = currDir + "/" + $("#rename").val().trim();

    if (oldName == rename) {
        hideRenameModal();
        $('.btnRename').css({ "opacity": "", "pointer-events": "" });
        $('.btnRename').val("Rename");
        return;
    }

    let formData = $("#renameForm").serializeArray();
    formData.find(function (input) { return input.name == 'rename'; }).value = rename; // overwrite cause we need trimmed value
    console.log(formData);

    // sending ajax post request
    let request = $.ajax({
        type: "POST",
        url: "rename.php",
        data: formData,
        dataType: "json",
    });
    request.done(function (response) {
        console.log(response);
        if (response.status == "success") {
            hideRenameModal();
            notify(response.message, 3, colorSuccess);
            refreshFileList();
        } else {
            notify(response.message, 3, colorError);
        }
    });
    request.fail(function (response) {
        console.log("something went wrong");
        console.log(response);
    });
    request.always(function () {
        $('.btnRename').css({ "opacity": "", "pointer-events": "" });
        $('.btnRename').val("Rename");
    });
}

function getSelectableItemsNumber() {
    let counter = 0;
    for (let i = 0; i < fileList.length; i++) {
        if (!fileList[i].isDir) counter++;
    }
    return counter;
}

function defaultViewStyle() {
    let currView = sessionStorage.getItem("viewStyle");

    if (currView == "grid") {
        $(".feTable").css("display", "none");
        $("#grid").css("display", "");
        $(".iconGrid").css("background", "#dae2f1");
        sessionStorage.setItem("viewStyle", "grid");
    } else {
        $(".feTable").css("display", "");
        $("#grid").css("display", "none");
        $(".iconGrid").css("background", "");
        sessionStorage.setItem("viewStyle", "list");
    }
}

function getAndDisplayFileList(viewStyle) {
    let queryString = window.location.search;
    let urlParams = new URLSearchParams(queryString);
    let dir = urlParams.get('dir');

    let apiURL = "get-file-list.php";
    if (dir != null) apiURL = "get-file-list.php?dir=" + dir;

    // sending ajax GET request
    let request = $.ajax({
        type: "GET",
        url: apiURL,
        dataType: "json",
    });
    request.done(function (response) {
        // console.log(response);
        if (response.status == "success") {
            fileList = response.files;
            totalSelectableItems = getSelectableItemsNumber();
            displayFileList(fileList, viewStyle);

            // setting up current dir/'you are here' text
            $(".cdText").text("/" + response.currDir);

            // let dirTree = response.currDir.split("/");

            // let yah = "";
            // for (let i = 0; i < dirTree.length; i++) {
            //     yah += '<span class="dirTree">' + dirTree[i] + '</span>';
            //     if (i != dirTree.length - 1) yah += '<span class="dirArrow"> > </span>';
            // }

            // $(".cdText").empty();
            // $(".cdText").append(yah);
        } else {
            $(".content").append('<p style="text-align: center;">' + response.message + '</p>');
        }
    });
    request.fail(function (response) {
        console.log("something went wrong");
        console.log(response);
    });
    request.always(function () {
    });
}

function displayFileList(list, viewStyle) {
    let data = "";

    if (viewStyle == "grid") data = createDataForGridView(list);
    else data = createDataForListView(list);

    $(".content").empty();
    $(".content").append(data);

    // taking care of selected checkboxes [useful in toggling list/grid]
    if (checkboxes.length > 0) {
        let currDir = $(".currDir .cdText").text().trim();
        $(".checkboxSingle").each(function () {
            let fileName = $(this).parent().parent().find(".fileName").text().trim();
            let filePath = currDir + "/" + fileName;

            if ($.inArray(filePath, checkboxes) !== -1) {
                $(this).prop('checked', true);
            }
        });

        // taking care of master checkbox
        if (checkboxes.length == totalSelectableItems) $("#checkboxMaster").prop('checked', true);
        else $("#checkboxMaster").prop('checked', false);

        // taking care of sidebar and single icon
        $(".batch").css("left", "0");
        $(".iconDelete, .iconDownload, .iconRename").css({ "opacity": "0.6", "pointer-events": "none" });
    }

    // taking care of search boxes
    $("#searchKey").val("");
}

function createDataForListView(list) {
    // <!-- table -->
    let data = `<table class="feTable">
    <tr style="background: #ecf0f8;">
    <th style="width: 3%;">
    <input type="checkbox" class="checkbox" id="checkboxMaster">
    </th>
    <th class="sortByName">
    Name
    <img src="./assets/images/sUp.png" alt="" srcset="" class="icon iconSort" id="nameUp" style="display: none;">
    <img src="./assets/images/sDown.png" alt="" srcset="" class="icon iconSort" id="nameDown">
    </th>
    <th colspan="2" style="width: 12%;" class="sortBySize">
    Size
    <img src="./assets/images/sUp.png" alt="" srcset="" class="icon iconSort" id="sizeUp" style="display: none;">
    <img src="./assets/images/sDown.png" alt="" srcset="" class="icon iconSort" id="sizeDown" style="display: none;">
    </th>
    <th colspan="2" style="width: 16%;" class="sortByModifiedTime">
    Last Modified
    <img src="./assets/images/sUp.png" alt="" srcset="" class="icon iconSort" id="modifiedTimeUp" style="display: none;">
    <img src="./assets/images/sDown.png" alt="" srcset="" class="icon iconSort" id="modifiedTimeDown" style="display: none;">
    </th>
    <th style="width: 15%;">Options</th>
    </tr>`;

    let id = 0;
    for (let i = 0; i < list.length; i++) {
        if (list[i].fileName == ".") continue;

        data += '<tr id="' + ++id + '">';

        // check box
        if (list[i].isDir) data += '<td></td>';
        else data += '<td><input type="checkbox" class="checkboxSingle"></td>';

        // file icon & name with link
        data += '<td>';
        if (list[i].isDir) data += '<a href="' + list[i].dirLink + '" class="dir">';

        data += '<img src="' + list[i].fileIcon + '" alt="" srcset="" class="icon iconExt ';
        if (!list[i].isDir) data += 'iconNoCursor';
        data += '">';

        data += '<span class="fileName" title="' + list[i].fileName + '">' + list[i].fileName + '</span>';

        if (list[i].isDir) data += '</a>';
        data += '</td>';

        // file size
        if (list[i].isDir) {
            data += '<td colspan="2" style="border-right: 1px solid #dae2f1;">Folder</td>';
        } else {
            data += "<td>" + list[i].size + "</td>";
            data += "<td>" + list[i].sizeUnit + "</td>";
        }

        // last modified
        let lastModified = formatDateTime(list[i].lastModified);
        data += `<td style="border-right: none; text-align: center; width: 8%;">` + lastModified.time + `</td>
                <td style="text-align: center; width: 8%;">` + lastModified.date + `</td>`;

        // delete icon
        data += '<td>';
        if (list[i].fileName != "..")
            data += '<img src="./assets/images/delete.png" alt="delete" srcset="" title="Delete" class="icon iconDelete">';

        // download icon
        if (!list[i].isDir)
            data += '<img src="./assets/images/download.png" alt="download" srcset="" title="Download" class="icon iconDownload">';

        // rename icon
        if (list[i].fileName != "..")
            data += '<img src="./assets/images/rename.png" alt="Rename" srcset="" title="Rename" class="icon iconRename">';

        data += '</td></tr>';
    }

    data += '</table>';

    return data;
}

function createDataForGridView(list) {
    // <!-- grid -->
    let data = `<div id="grid">`;

    let id = 0;
    for (let i = 0; i < list.length; i++) {
        if (list[i].fileName == ".") continue;

        data += `<div class="fileCard">
                <div class="cardIcon" style = "position: relative;">`;

        // check box
        if (!list[i].isDir) data += '<input type="checkbox" class="checkboxSingle" style="position: absolute; top:10px; left:10px;">';

        // icon
        if (list[i].isDir) data += '<a href="' + list[i].dirLink + '"><img src = "' + list[i].fileIcon + '" alt="" srcset="" style="height:120px; display:block; margin: auto; padding:5px;"></div><div class="cardText"></a>';
        else data += '<img src = "' + list[i].fileIcon + '" alt="" srcset="" style="height:100px; display:block; margin: auto; padding:5px;"></div><div class="cardText">';

        // file name with link
        if (list[i].isDir) data += '<p class="fileName" title="' + list[i].fileName + '"style="font-size:16px; padding: 0px 5px;"><a href="' + list[i].dirLink + '" class="dir">' + list[i].fileName + '</a></p>';
        else data += `<p class="fileName" title="` + list[i].fileName + `"style="font-size:16px; padding: 0px 5px;">` + list[i].fileName + `</p>
            <p class="fileSize" style = "font-size: 12px; text-align:center;">` + list[i].size + ` ` + list[i].sizeUnit + `</p>`;

        // last modified
        let lastModified = formatDateTime(list[i].lastModified);
        data += `<p class="lastModified" style="font-size: 12px; text-align:center;">` + lastModified.time + ` ` + lastModified.date + `</p></div>`;

        // file ops
        data += '<div class="cardOps">';

        if (list[i].fileName != "..")
            data += '<img src="./assets/images/delete.png" alt="delete" srcset="" title="Delete" class="icon iconDelete">';

        // download icon
        if (!list[i].isDir)
            data += '<img src="./assets/images/download.png" alt="download" srcset="" title="Download" class="icon iconDownload">';

        // rename icon
        if (list[i].fileName != "..")
            data += '<img src="./assets/images/rename.png" alt="Rename" srcset="" title="Rename" class="icon iconRename">';

        data += '</div>';   // .cardOps div closing

        data += '</div>';   // .fileCard div closing
    }

    data += '</div>';   // #grid div closing

    return data;
}

function refreshFileList() {
    // refreshing file list
    let currView = sessionStorage.getItem("viewStyle");
    getAndDisplayFileList(currView);

    // resetting checkboxes
    checkboxes = [];
}

function formatDateTime(unixTimestamp) {
    let d = new Date(unixTimestamp * 1000); // converting into milliseconds
    let month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let date = d.getDate() + " " + month[d.getMonth()] + ", " + d.getFullYear();
    let time = d.toLocaleTimeString().toLowerCase();
    return { "time": time, "date": date };
}