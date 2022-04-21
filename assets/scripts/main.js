console.log("scripts connected successfully");

const colorSuccess = "#00b359";
const colorError = "#ff4d4d";
let sortByNameAsc = false;
let sortBySizeAsc = false;
let currentOngoingRequest = false;
let checkboxes = [];

$(document).ready(function () {
    $(".createFile").on("click", function () {
        $(".createFile img").css("background", "#79a0ed");
        $(".createDir img").css("background", "");
        initCreate("file");
    });

    $(".createDir").on("click", function () {
        $(".createDir img").css("background", "#79a0ed");
        $(".createFile img").css("background", "");
        initCreate("directory");
    });

    $("#addForm").on('submit', function (e) {
        e.preventDefault();
        let currDir = $(".currDir .cdText").text().trim();

        if ($(".addInput").val().trim().length == 0) {
            $(".addInput").val("");
            return false;
        }

        let formData = $("#addForm").serializeArray();
        formData.push({ name: 'currDir', value: currDir });
        formData.find(function (input) { return input.name == 'create'; }).value = $(".addInput").val().trim(); // overwrite cause we need trim

        createFileOrDir(formData);
        return false;
    });

    $("body").on("click", ".iconDelete", function () {
        let currRow = $(this).closest("tr");
        let currRowSerial = currRow.attr("id");

        $("#currSerial").text(currRowSerial);
        displayDeleteModal();
        // further process of delete will trigger from modal button clicked
    });

    $("body").on("click", ".btnDelete", function () {
        if (checkboxes.length == 0) {
            let currRowSerial = $("#currSerial").text().trim();
            let fileName = $("tr#" + currRowSerial).find("td:eq(1)").text().trim();
            let currDir = $(".currDir .cdText").text().trim();
            let filePath = currDir + "/" + fileName;

            deleteFile(filePath, currRowSerial);
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
        $(".btnNewName").val("New Name");
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

        hideFileError();
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

    $(".iconRightArrow").on("click", function () {
        $(".create").css("width", "60px");
        $(".formSpan").css("display", "none");
        $(".iconRightArrow").css("display", "none");
        $(".createFile img").css("background", "");
        $(".createDir img").css("background", "");
    });

    $("body").on("click", ".iconDownload", function () {
        let currRow = $(this).closest("tr");
        let fileName = currRow.find("td:eq(1)").text().trim();
        let currDir = $(".currDir .cdText").text().trim();
        let filePath = currDir + "/" + fileName;
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

    $(".sortByName").on("click", function () {
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

    $(".sortBySize").on("click", function () {
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

    $("body").on("click", ".checkbox", function () {
        let currRow = $(this).closest("tr");
        let currRowSerial = currRow.attr("id");
        let fileName = currRow.find("td:eq(1)").text().trim();
        let currDir = $(".currDir .cdText").text().trim();
        let filePath = currDir + "/" + fileName;

        let item = { id: currRowSerial, filePath: filePath };

        if ($(this).is(":checked")) checkboxes.push(item);
        else {
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
    });

    $(".iconDownloadMarked").on("click", function () {
        downloadBatch();
    });

    $(".iconDeleteMarked").on("click", function () {
        displayDeleteModal();
    });
});

function initCreate(what) {
    $("#fileType").val(what);
    $(".create").css("width", "400px");
    setTimeout(function () {
        $(".formSpan").css("display", "");
        $(".addInput").attr("placeholder", "Enter " + what + " name");
        $(".addInput").focus();
        $(".iconRightArrow").css("display", "");
    }, 375);

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
            addNewRow(response);
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

function deleteFile(filePath, rowSerial) {
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
            // removing deleted row
            $("tr#" + rowSerial).remove();
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
    let isExist = false;
    let responseFileName, url;
    if (replaceType == "true" && customName != "") url = "/upload.php?todo=check&currDir=" + currDir + "&file=" + customName;
    else url = "/upload.php?todo=check&currDir=" + currDir + "&file=" + file.name;

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

    if (isExist && replaceType == "false") {
        // open interactive modal
        displayUploadModal();
        console.log(currentOngoingRequest);

        $(".btnReplace").val("Replace");
        $(".btnNewName").val("New Name");
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

                if (replaceType != "true") addNewRow(response);
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

function addNewRow(res) {
    let lastSerial = $('tr:last').attr('id');
    lastSerial++;

    let row = '<tr id="' + lastSerial + '">';

    // check box
    if (res.isDir) row += '<td></td>';
    else row += '<td><input type="checkbox" class="checkbox"></td>';

    // file icon
    row += '<td><img src="' + res.fileIcon + '" alt="" srcset="" class="icon iconExt">';

    // file name with link
    if (res.isDir) {
        row += '<a href="' + res.dirLink + '" class="dir">' + res.fileName + '</a>';
    } else
        row += '<span>' + res.fileName + '</span></td>';

    // file size
    if (res.isDir) {
        row += '<td colspan="2" style="border-right: 1px solid #dae2f1;">Folder</td>';
    } else {
        row += '<td>' + res.size + '</td>';
        row += '<td>' + res.sizeUnit + '</td>';
    }

    // delete icon
    row += `<td><span><img src="./assets/images/delete.png" alt="delete" srcset="" title="Delete" class="icon iconDelete"></span>`;

    // download icon
    if (!res.isDir) row += `<span><img src="./assets/images/download.png" alt="download" srcset="" title="Download" class="icon iconDownload"></span></td></tr>`;

    $(".feTable").append(row);
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
}

function hideFileError() {
    $("#uploadResult").css("display", "none");
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

    let startIdx = 3;

    for (let i = 3; i <= totalRows; i++) { // tr 1-indexed
        let txt = tbody.find('tr:nth-child(' + i + ')').find('td:nth-child(5)').find('span:nth-child(2)').html();
        if (txt != undefined) {
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
            return ($('td:nth-child(3)', a).text() * 1) - ($('td:nth-child(3)', b).text() * 1)
                || ($('td:nth-child(2)', a).text().localeCompare($('td:nth-child(2)', b).text()));
        } else {
            return ($('td:nth-child(3)', b).text() * 1) - ($('td:nth-child(3)', a).text() * 1)
                || ($('td:nth-child(2)', b).text().localeCompare($('td:nth-child(2)', a).text()));
        }
    }).appendTo(tbody);

    // file sorting
    tbody.find('tr:gt(1)tr:lt(' + (totalRows - rangeIdx - 2) + ')').sort(function (a, b) {
        // tbody.find('tr:gt(1)').sort(function (a, b) {
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
            return (($('td:nth-child(3)', a).text() * aSize) - ($('td:nth-child(3)', b).text() * bSize))
                || ($('td:nth-child(2)', a).text().localeCompare($('td:nth-child(2)', b).text()));
        } else {
            return (($('td:nth-child(3)', b).text() * bSize) - ($('td:nth-child(3)', a).text() * aSize))
                || ($('td:nth-child(2)', b).text().localeCompare($('td:nth-child(2)', a).text()));
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