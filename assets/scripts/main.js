console.log("scripts connected successfully");

const colorSuccess = "#00b359";
const colorError = "#ff4d4d";
let sortByNameAsc = true;
let sortBySizeAsc = false;
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
            displayFileList("list");
            sessionStorage.setItem("viewStyle", "list");
            $(".iconGrid").css("background", "");
        } else {
            displayFileList("grid");
            sessionStorage.setItem("viewStyle", "grid");
            $(".iconGrid").css("background", "#dae2f1");
        }
    });

    $(".iconSearch").on("click", function () {
        hideAllOps();
        $(".search").css("top", "10px");
        $(".optionsIcon .iconSearch").css({ "background": "#dae2f1" });
        $(".search input").focus();
    });

    $(".iconCreateFile").on("click", function () {
        hideAllOps();
        $(".create").css("top", "10px");
        $(".iconCreateFile").css({ "background": "#dae2f1" });
        $(".fileType").val("file");
        $(".addInput").attr("placeholder", "Enter file name");
        $(".addInput").focus();
    });

    $(".iconCreateDir").on("click", function () {
        hideAllOps();
        $(".create").css("top", "10px");
        $(".iconCreateDir").css({ "background": "#dae2f1" });
        $(".fileType").val("directory");
        $(".addInput").attr("placeholder", "Enter directory name");
        $(".addInput").focus();
    });

    $(".iconUpload").on("click", function () {
        hideAllOps();
        $(".uploads").css("top", "10px");
        $(".optionsIcon .iconUpload").css({ "background": "#dae2f1" });
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
        $('.btnReplace, .btnNewName, .btnCancelReplace, .btnCancelNewName').css("opacity", "");
        $('.btnReplace, .btnNewName, .btnCancelReplace, .btnCancelNewName').css('pointer-events', "");
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
        $('.btnReplace, .btnCancelNewName, .btnNewName').css("opacity", ".7");
        $('.btnReplace, .btnCancelNewName, .btnNewName').css('pointer-events', "none");

        uploadFile(currDir, files, "", "true");
    });

    $(".btnNewName").on("click", function () {
        let files = $('#fileToUpload').prop('files');
        let currDir = $(".currDir .cdText").text().trim();
        let customName = $("#customName").val().trim();

        $(".btnNewName").val("Uploading...");
        $('.btnNewName, .btnReplace, .btnCancelReplace').css("opacity", ".7");
        $('.btnNewName, .btnReplace, .btnCancelReplace').css('pointer-events', "none");

        uploadFile(currDir, files, customName, "custom");
    });

    $("body").on("click", ".iconDownload", function () {
        let currDir = $(".currDir .cdText").text().trim();
        let fileName = $(this).parent().parent().find(".fileName").text().trim();
        let filePath = currDir + "/" + fileName;
        console.log(filePath);
        downloadFile(filePath);
    });

    $("body").on("click", ".iconRename", function () {
        let currRow = $(this).closest("tr");
        let currRowSerial = currRow.attr("id");
        $("#currSerial").text(currRowSerial);   // #currentSerial element is in delete modal

        let fileName = currRow.find("td:eq(1)").text().trim();
        let currDir = $(".currDir .cdText").text().trim();
        let filePath = currDir + "/" + fileName;

        $("#oldName").val(filePath);
        $("#rename").val(fileName);

        displayRenameModal();

        let idx = fileName.lastIndexOf(".");
        if (idx == -1) idx = fileName.length;
        $("#rename").focus();
        $("#rename").setCursorPosition(idx);
        // further process of rename will trigger from modal button clicked
    });

    $("#renameForm").on("submit", function () {
        let currDir = $(".currDir .cdText").text().trim();
        let currRowSerial = $("#currSerial").text().trim();
        renameFile(currDir, currRowSerial);
        return false;
    });

    $("body").on("click", ".sortByName", function () {
        sortByName($('.feTable'), !sortByNameAsc);
        sortByNameAsc = !sortByNameAsc;

        if (sortByNameAsc) {
            $("#nameDown").css("display", "");
            $("#nameUp").css("display", "none");
            $("#sizeUp").css("display", "none");
            $("#sizeDown").css("display", "none");
        } else {
            $("#nameUp").css("display", "");
            $("#nameDown").css("display", "none");
            $("#sizeUp").css("display", "none");
            $("#sizeDown").css("display", "none");
        }
    });

    $("body").on("click", ".sortBySize", function () {
        sortBySize($('.feTable'), !sortBySizeAsc);
        sortBySizeAsc = !sortBySizeAsc;

        if (sortBySizeAsc) {
            $("#sizeDown").css("display", "");
            $("#sizeUp").css("display", "none");
            $("#nameUp").css("display", "none");
            $("#nameDown").css("display", "none");
        } else {
            $("#sizeUp").css("display", "");
            $("#sizeDown").css("display", "none");
            $("#nameUp").css("display", "none");
            $("#nameDown").css("display", "none");
        }
    });

    $("body").on("click", ".checkboxSingle", function () {
        let currRow = $(this).closest("tr");
        let currRowSerial = currRow.attr("id");
        let fileName = currRow.find("td:eq(1)").text().trim();
        let currDir = $(".currDir .cdText").text().trim();
        let filePath = currDir + "/" + fileName;

        let item = { id: currRowSerial, filePath: filePath };

        if ($(this).is(":checked")) {
            let iconLink = currRow.find("td:eq(1) img").attr("src");
            console.log(iconLink);
            console.log(iconLink.endsWith("dir.png"));

            checkboxes.push(item);
        } else {
            checkboxes = checkboxes.filter(function (checkboxes) {
                return checkboxes.filePath != filePath;
            });
        }

        console.log(checkboxes);

        if (checkboxes.length > 0) {
            $(".batch").css("left", "0");
            $(".iconDelete, .iconDownload, .iconRename").css("opacity", "0.6");
            $(".iconDelete, .iconDownload, .iconRename").css("pointer-events", "none");
        } else {
            $(".batch").css("left", "-52px");
            $(".iconDelete, .iconDownload, .iconRename").css("opacity", "");
            $(".iconDelete, .iconDownload, .iconRename").css("pointer-events", "");
        }

        // taking care of master checkbox
        if (checkboxes.length == totalSelectableItems) $("#checkboxMaster").prop('checked', true);
        else $("#checkboxMaster").prop('checked', false);
    });

    $("body").on("click", "#checkboxMaster", function () {
        let isSelected = $(this).is(":checked");

        if (isSelected) selectAllItems();
        else unSelectAllItems();

        console.log(checkboxes);
        if (checkboxes.length > 0) {
            $(".batch").css("left", "0");
            $(".iconDelete, .iconDownload, .iconRename").css("opacity", "0.6");
            $(".iconDelete, .iconDownload, .iconRename").css("pointer-events", "none");
        } else {
            $(".batch").css("left", "-52px");
            $(".iconDelete, .iconDownload, .iconRename").css("opacity", "");
            $(".iconDelete, .iconDownload, .iconRename").css("pointer-events", "");
        }
    });

    $(".iconDownloadMarked").on("click", function () {
        downloadBatch();
    });

    $(".iconDeleteMarked").on("click", function () {
        displayDeleteModal();
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
            let currRowSerial = $(this).attr("id");
            let fileName = $(this).find("td:eq(1)").text().trim();
            let filePath = currDir + "/" + fileName;
            let item = { id: currRowSerial, filePath: filePath };

            $(this).find("td:eq(0) input").prop('checked', true);
            checkboxes.push(item);
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
    $('#addSubmit').css("opacity", ".7");
    $('#addSubmit').css('pointer-events', "none");
    $('#addSubmit').val("Creating...");

    // sending ajax post request
    let request = $.ajax({
        type: "POST",
        url: "/create.php",
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
        $('#addSubmit').css("opacity", "");
        $('#addSubmit').css('pointer-events', "");
        $('#addSubmit').val("Create");
    });
}

function deleteFile(filePath) {
    $('.btnDelete').css("opacity", ".7");
    $('.btnDelete').css('pointer-events', "none");
    $('.btnDelete').val("Deleting...");

    let data = { fileToDelete: filePath };

    // sending ajax post request
    let request = $.ajax({
        type: "POST",
        url: "/delete.php",
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
        $('.btnDelete').css("opacity", "");
        $('.btnDelete').css('pointer-events', "");
        $('.btnDelete').val("Delete");

        hideDeleteModal();
    });
}

function deleteBatch() {
    $('.btnDelete').css("opacity", ".7");
    $('.btnDelete').css('pointer-events', "none");
    $('.btnDelete').val("Deleting...");

    let data = { fileToDelete: checkboxes };

    // sending ajax post request
    let request = $.ajax({
        type: "POST",
        url: "/delete.php",
        data: JSON.stringify(data),
        dataType: "json",
    });
    request.done(function (response) {
        console.log(response);
        if (response.status == "success") {
            notify(response.message, 3, colorSuccess);
            // removing deleted row
            for (let i = 0; i < checkboxes.length; i++) {
                $("tr#" + checkboxes[i].id).remove();
            }
            checkboxes = [];
            $(".batch").css("left", "-52px");
            $(".iconDelete, .iconDownload").css("opacity", "");
            $(".iconDelete, .iconDownload").css("pointer-events", "");
        } else {
            notify(response.message, 3, colorError);
        }
    });
    request.fail(function (response) {
        console.log("something went wrong");
        console.log(response);
    });
    request.always(function () {
        $('.btnDelete').css("opacity", "");
        $('.btnDelete').css('pointer-events', "");
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

    $('#btnUpload, #btnBrowseFile').css("opacity", ".7");
    $('#btnUpload, #btnBrowseFile').css('pointer-events', "none");
    $('#btnUpload img').attr("src", "./assets/images/uploading.gif");
    $('#btnUpload span').text("Uploading...");

    // first checking if file already exist or not
    let isExist = false, responseFileName;
    if (replaceType != "true") { // if replaceType is true, should replace(no need to check for existance)
        let url = "/upload.php?todo=check&currDir=" + currDir + "&file=" + file.name;;
        if (customName != "") url = "/upload.php?todo=check&currDir=" + currDir + "&file=" + customName;

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
        $('.btnReplace, .btnNewName, .btnCancelReplace, .btnCancelNewName').css("opacity", "");
        $('.btnReplace, .btnNewName, .btnCancelReplace, .btnCancelNewName').css('pointer-events', "");

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
            url: "/upload.php",
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
            $('#btnUpload, #btnBrowseFile').css("opacity", "");
            $('#btnUpload, #btnBrowseFile').css('pointer-events', "");
            $('#btnUpload img').attr("src", "./assets/images/upCloud.png");
            $('#btnUpload span').text("Upload");
        });
        currentOngoingRequest = request;
    }
}

function downloadFile(filePath) {
    let downloadURL = "/download.php?fileToDownload=" + encodeURIComponent(filePath);
    window.location = downloadURL;
}

function downloadBatch() {
    let params = checkboxes.map(function (item) {
        return encodeURIComponent(item.filePath);
    }).join(",");

    let compressURL = "/download.php?fileToDownload=" + params + "&todo=compress";
    let downloadURL = "/download.php?fileToDownload=" + params + "&todo=download";
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

    $('#btnUpload, #btnBrowseFile').css("opacity", "");
    $('#btnUpload, #btnBrowseFile').css('pointer-events', "");
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
};

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
        if (isAsc) {
            return $('td:nth-child(2)', a).text().localeCompare($('td:nth-child(2)', b).text());
        } else {
            return $('td:nth-child(2)', b).text().localeCompare($('td:nth-child(2)', a).text());
        }
    }).appendTo(tbody);

    // file sorting
    tbody.find('tr:gt(1)tr:lt(' + (totalRows - rangeIdx - 2) + ')').sort(function (a, b) {
        if (isAsc) {
            return $('td:nth-child(2)', a).text().localeCompare($('td:nth-child(2)', b).text());
        } else {
            return $('td:nth-child(2)', b).text().localeCompare($('td:nth-child(2)', a).text());
        }
    }).appendTo(tbody);
}

function sortBySize(table, isAsc) {
    let tbody = table.find('tbody');

    let rangeIdx = getFinalDirIdx(table) - 2;
    let totalRows = tbody.find('tr').length;

    // directory sorting
    tbody.find('tr:gt(1)tr:lt(' + rangeIdx + ')').sort(function (a, b) {
        if (isAsc) {
            return ($('td:nth-child(3)', a).text() * 1) - ($('td:nth-child(3)', b).text() * 1);
        } else {
            return ($('td:nth-child(3)', b).text() * 1) - ($('td:nth-child(3)', a).text() * 1);
        }
    }).appendTo(tbody);

    // file sorting
    tbody.find('tr:gt(1)tr:lt(' + (totalRows - rangeIdx - 2) + ')').sort(function (a, b) {
        let aSize, bSize;

        if ($('td:nth-child(4)', a).text() == "bytes") aSize = 1.0;
        else if ($('td:nth-child(4)', a).text() == "kB") aSize = 1024.0;
        else if ($('td:nth-child(4)', a).text() == "MB") aSize = 1024.0 * 1024.0;
        else if ($('td:nth-child(4)', a).text() == "GB") aSize = 1024.0 * 1024.0 * 1024.0;

        if ($('td:nth-child(4)', b).text() == "bytes") bSize = 1.0;
        else if ($('td:nth-child(4)', b).text() == "kB") bSize = 1024.0;
        else if ($('td:nth-child(4)', b).text() == "MB") bSize = 1024.0 * 1024.0;
        else if ($('td:nth-child(4)', b).text() == "GB") bSize = 1024.0 * 1024.0 * 1024.0;

        if (isAsc) {
            // sort by size then name
            return (($('td:nth-child(3)', a).text() * aSize) - ($('td:nth-child(3)', b).text() * bSize));
        } else {
            return (($('td:nth-child(3)', b).text() * bSize) - ($('td:nth-child(3)', a).text() * aSize));
        }
    }).appendTo(tbody);
}

function renameFile(currDir, rowSerial) {
    $('.btnRename').css("opacity", ".7");
    $('.btnRename').css('pointer-events', "none");
    $('.btnRename').val("Renaming...");

    let oldName = $("#oldName").val().trim();
    let rename = currDir + "/" + $("#rename").val().trim();
    if (oldName == rename) {
        hideRenameModal();
        $('.btnRename').css("opacity", "");
        $('.btnRename').css('pointer-events', "");
        $('.btnRename').val("Rename");
        return;
    }

    let formData = $("#renameForm").serializeArray();
    formData.find(function (input) { return input.name == 'rename'; }).value = rename; // overwrite cause we need trim
    console.log(formData);

    // sending ajax post request
    let request = $.ajax({
        type: "POST",
        url: "/rename.php",
        data: formData,
        dataType: "json",
    });
    request.done(function (response) {
        console.log(response);
        if (response.status == "success") {
            notify(response.message, 3, colorSuccess);
            $("tr#" + rowSerial).find("td:eq(1) img").attr("src", response.fileIcon);
            if (response.isDir) {
                $("tr#" + rowSerial).find("td:eq(1) a").attr("href", response.dirLink);
                $("tr#" + rowSerial).find("td:eq(1) a").text(response.fileName);
            } else {
                $("tr#" + rowSerial).find("td:eq(1) span").text(response.fileName);
            }
            hideRenameModal();
        } else {
            notify(response.message, 3, colorError);
        }
    });
    request.fail(function (response) {
        console.log("something went wrong");
        console.log(response);
    });
    request.always(function () {
        $('.btnRename').css("opacity", "");
        $('.btnRename').css('pointer-events', "");
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

    let apiURL = "/get-file-list.php";
    if (dir != null) apiURL = "/get-file-list.php?dir=" + dir;

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
            displayFileList(viewStyle);
            totalSelectableItems = getSelectableItemsNumber();
            $(".cdText").text("/" + response.currDir);
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

function displayFileList(viewStyle) {
    let data = "";

    if (viewStyle == "grid") data = createDataForGridView();
    else data = createDataForListView();

    $(".content").empty();
    $(".content").append(data);
}

function createDataForListView() {
    // <!-- table -->
    let data = `<table class="feTable">
    <tr>
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
    <th style="width: 15%;">Options</th>
    </tr>`;

    let id = 0;
    for (let i = 0; i < fileList.length; i++) {
        if (fileList[i].fileName == ".") continue;

        data += '<tr id="' + ++id + '">';

        // check box
        if (fileList[i].isDir) data += '<td></td>';
        else data += '<td><input type="checkbox" class="checkboxSingle"></td>';

        // file icon & name with link
        data += '<td>';
        if (fileList[i].isDir) data += '<a href="' + fileList[i].dirLink + '" class="dir">';

        data += '<img src="' + fileList[i].fileIcon + '" alt="" srcset="" class="icon iconExt ';
        if (!fileList[i].isDir) data += 'iconNoCursor';
        data += '">';

        data += '<span class="fileName">' + fileList[i].fileName + '</span>';

        if (fileList[i].isDir) data += '</a>';
        data += '</td>';

        // file size
        if (fileList[i].isDir) {
            data += '<td colspan="2" style="border-right: 1px solid #dae2f1;">Folder</td>';
        } else {
            data += "<td>" + fileList[i].size + "</td>";
            data += "<td>" + fileList[i].sizeUnit + "</td>";
        }

        // delete icon
        data += '<td>';
        if (fileList[i].fileName != "..")
            data += '<img src="./assets/images/delete.png" alt="delete" srcset="" title="Delete" class="icon iconDelete">';

        // download icon
        if (!fileList[i].isDir)
            data += '<img src="./assets/images/download.png" alt="download" srcset="" title="Download" class="icon iconDownload">';

        // rename icon
        if (fileList[i].fileName != "..")
            data += '<img src="./assets/images/rename.png" alt="Rename" srcset="" title="Rename" class="icon iconRename">';

        data += '</td></tr>';
    }

    data += '</table>';

    return data;
}

function createDataForGridView() {
    // <!-- grid -->
    let data = `<div id="grid">`;

    let id = 0;
    for (let i = 0; i < fileList.length; i++) {
        if (fileList[i].fileName == ".") continue;

        data += `<div class="fileCard">
                <div class="cardIcon" style = "position: relative;">`;

        // check box
        if (!fileList[i].isDir) data += '<input type="checkbox" class="checkboxSingle" style="position: absolute; top:10px; left:10px;">';

        // icon
        if (fileList[i].isDir) data += '<a href="' + fileList[i].dirLink + '"><img src = "' + fileList[i].fileIcon + '" alt="" srcset="" style="height:120px; display:block; margin: auto; padding:5px;"></div><div class="cardText"></a>';
        else data += '<img src = "' + fileList[i].fileIcon + '" alt="" srcset="" style="height:100px; display:block; margin: auto; padding:5px;"></div><div class="cardText">';

        // file name with link
        if (fileList[i].isDir) data += '<p class="fileName" style="font-size:16px; padding: 5px;"><a href="' + fileList[i].dirLink + '" class="dir">' + fileList[i].fileName + '</a></p></div>';
        else data += `<p class="fileName" style="font-size:16px; padding: 5px;">` + fileList[i].fileName + `</p>
            <p class="fileSize" style = "font-size: 14px; text-align:center;">` + fileList[i].size + ` ` + fileList[i].sizeUnit + `</p></div>`;

        // file ops
        data += '<div class="cardOps">';

        if (fileList[i].fileName != "..")
            data += '<img src="./assets/images/delete.png" alt="delete" srcset="" title="Delete" class="icon iconDelete">';

        // download icon
        if (!fileList[i].isDir)
            data += '<img src="./assets/images/download.png" alt="download" srcset="" title="Download" class="icon iconDownload">';

        // rename icon
        if (fileList[i].fileName != "..")
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
}