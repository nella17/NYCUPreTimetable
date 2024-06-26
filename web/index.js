SemesterList = []
Year = '?'
Semester = '?'
AllCourse = {}
CourseSelectedList = []
CourseDisableList = []
UsingShareData = false

function save(){
    if(UsingShareData){
        return ;
    }
    localStorage.setItem(`CourseSelectedList-${Year}-${Semester}`,JSON.stringify(CourseSelectedList));
    localStorage.setItem(`CourseDisableList-${Year}-${Semester}`,JSON.stringify(CourseDisableList));
}

function load(){
    CourseSelectedList = localStorage.getItem(`CourseSelectedList-${Year}-${Semester}`);
    CourseSelectedList = JSON.parse(CourseSelectedList);
    if(CourseSelectedList==null){
        CourseSelectedList = []
    }
    CourseDisableList = localStorage.getItem(`CourseDisableList-${Year}-${Semester}`);
    CourseDisableList = JSON.parse(CourseDisableList);
    if(CourseDisableList==null){
        CourseDisableList = []
    }
}

function gentable(){
    TimeList = ["y","z","1","2","3","4","n","5","6","7","8","9","a","b","c","d"];
    DayList = ["M","T","W","R","F","S","U"];
    TimeStatement = ["6:00 ~ 6:50","7:00 ~ 7:50","8:00 ~ 8:50","9:00 ~ 9:50","10:10 ~ 11:00","11:10 ~ 12:00","12:20 ~ 13:10","13:20 ~ 14:10","14:20 ~ 15:10","15:30 ~ 16:20","16:30 ~ 17:20","17:30 ~ 18:20","18:30 ~ 19:20","19:30 ~ 20:20","20:30 ~ 21:20","21:30 ~ 22:20"]
    Tid=0;
    TimeList.forEach(T => {
        //console.log(T);
        tr = `<tr id="R-${T}"><td scope="row">${T}-(${TimeStatement[Tid++]})</td>`;
        for(D=0;D<7;D++){
            tr += `<td id="E-${DayList[D]}${T}" class="TableElement" align='center' style="vertical-align: middle;"></td>`;
        }
        tr += `</tr>`;
        $("#timetable tbody").append(tr);
    });
}

function parseTime(timeCode){
    timeCode += ',';
    re = /\-[A-Za-z0-9\[\]]+,/g;
    timeCode = timeCode.replaceAll(re, '');
    re = /[MTWRFSU][1-9yznabcd]+/g;
    timelist = timeCode.match(re);
    if(timelist==null){
        return res;
    }
    res = [];
    timelist.forEach(T => {
        for(i=1;i<T.length;i++){
            res.push(T[0]+T[i]);
        }
    });
    return res;
}

function getCourseData(CourseID){
    id = `${Year}${Semester}_${CourseID}`;
    if(! (id in AllCourse)){
        alert(`Course ID ${CourseID} not found`);
        return false;
    }
    return AllCourse[id];
}

function calcCreditHours(CourseList = CourseSelectedList){
    credit = 0.0;
    hours = 0.0;
    CourseList.forEach(CourseID => {
        if(CourseDisableList.includes(CourseID)){
            return;
        }
        Course = getCourseData(CourseID);
        credit += parseFloat(Course["credit"]);
        hours += parseFloat(Course["hours"]);
    });
    $("#Credit").html(credit);
    $("#Hours").html(hours);
}

function showTable(CourseList = CourseSelectedList){
    $("#timetable tbody").empty();
    gentable();
    CourseList.forEach(CourseID => {
        Course = getCourseData(CourseID);
        timelist = parseTime(Course['time']);
        for(i=0;i<timelist.length;i++){
            //close = `<button type="button" class="close" aria-label="Close" name="${Course['id']}"><span aria-hidden="true">&times;</span></button>`
            if(CourseDisableList.includes(CourseID)){
                disabled = "disabled";
            }
            else{
                disabled = "";
            }
            html = `<button type="button" class="btn btn-outline-secondary course ${disabled}" name="${Course['id']}">${Course['name']}</button><br>`
            $(`#E-${timelist[i]}`).append(html);
        }
    });
    calcCreditHours();
}

function AddCourse(CourseID){
    if(CourseSelectedList.includes(CourseID)){
        alert("The course had been added.");
        return ;
    }
    if(!getCourseData(CourseID)) {
        return;
    }
    CourseSelectedList.push(CourseID);
    save();
    showTable();
}

function DeleteCourse(CourseID){
    if(!CourseSelectedList.includes(CourseID)){
        alert("The course hadn'd been added.");
        return ;
    }
    CourseSelectedList.splice(CourseSelectedList.indexOf(CourseID),1);
    save();
    showTable();
}

function EnableDisableCourse(CourseID){
    if(!CourseSelectedList.includes(CourseID)){
        alert("The course hadn'd been added.");
        return ;
    }
    if(!CourseDisableList.includes(CourseID)){
        CourseDisableList.push(CourseID);
    }
    else{
        CourseDisableList.splice(CourseDisableList.indexOf(CourseID),1);
    }
    save();
    showTable();
}

function shareLink(){
    shareCode = btoa(JSON.stringify(CourseSelectedList));
    console.log(shareCode);
    link = `${location.protocol}//${location.host}${location.pathname}?share=${shareCode}`;
    $("#CopyURL").val(link);
    $("#CopyURL").attr("type","text");
    $("#CopyURL").select();
    document.execCommand('copy');
    $("#CopyURL").attr("type","hidden");
    $("#CopiedToast .toast-body a").attr("href",link);
    $("#CopiedToast").toast("show");
}

function setCourseInfoModal(CourseID){
    Course = getCourseData(CourseID);
    $("#CourseInfoModal-Title").html(Course["name"]);
    $("#CourseInfoModal-info ul").empty();
    $("#CourseInfoModal-info ul").append(`<li>當期課號： ${Course["id"]}</li>`);
    $("#CourseInfoModal-info ul").append(`<li>授課教師： ${Course["teacher"]}</li>`);
    $("#CourseInfoModal-info ul").append(`<li>時段教室： ${Course["time"]}</li>`);
    $("#CourseInfoModal-info ul").append(`<li>學　　分： ${Course["credit"]}</li>`);
    $("#CourseInfoModal-Delete").attr("name",CourseID);
    $("#CourseInfoModal-ED").attr("name",CourseID);
    if(!CourseDisableList.includes(CourseID)){
        $("#CourseInfoModal-ED").html("Disable");
        $("#CourseInfoModal-ED").removeClass("btn-primary");
        $("#CourseInfoModal-ED").addClass("btn-secondary");
    }
    else{
        $("#CourseInfoModal-ED").html("Enable");
        $("#CourseInfoModal-ED").removeClass("btn-secondary");
        $("#CourseInfoModal-ED").addClass("btn-primary");
    }
    $("#CourseInfoModal-OutlineLink").attr("href",`https://timetable.nycu.edu.tw/?r=main/crsoutline&Acy=${Year}&Sem=${Semester}&CrsNo=${CourseID}`);
}

$( document ).ready(async function() {
    SemesterList = await fetch('data.json').then(res => res.json()).then(r => r.map(x => x.replace('.json','')).map(x => [x.substr(0,x.length-1),x.at(-1)]).reverse())
    Year = SemesterList.at(0)[0]
    Semester = SemesterList.at(0)[1]

    LastYear = localStorage.getItem("LastYear");
    if(LastYear == null) LastYear = Year;
    // else LastYear = parseInt(LastYear);
    LastSemester = localStorage.getItem("LastSemester");
    if(LastSemester == null) LastSemester = Semester;
    // else LastSemester = parseInt(LastSemester);
    checkYS = false;
    SemesterList.forEach(function(S){if(S[0]==LastYear && S[1]==LastSemester)checkYS=true;});
    if(checkYS){
        Year = LastYear;
        Semester = LastSemester;
    }
    
    $("#semesterDropdownText").html(`${Year}-${Semester}`);
    SemesterList.forEach(function(S){
        active = "";
        if(S[0]==Year && S[1]==Semester){
            active = "active";
        }
        $("#semesterDropdownMenu").append(`<a class="dropdown-item ${active}" id="semester-item-${S[0]}-${S[1]}" href="#" onclick="changeSemester('${S[0]}','${S[1]}')">${S[0]}-${S[1]}</a>`);
    });
    
    AllCourse = await fetch(`data/${Year}${Semester}.json`).then(res => res.json());
    gentable();
    urlp = new URLSearchParams(window.location.search);
    load();
    if(urlp.has('share')){
        //console.log(urlp.get('share'));
        CourseSelectedList = JSON.parse(atob(urlp.get('share')));
        CourseDisableList = [];
        UsingShareData = true;
        $("#SharingModal").modal('show');
    }
    showTable();
    $("#timetable").on("mouseenter",".course",function(){
        id = $(this).attr("name");
        $(`button[name=${id}]`).addClass("active");
    });
    $("#timetable").on("mouseleave",".course",function(){
        id = $(this).attr("name");
        $(`button[name=${id}]`).removeClass("active");
    });

    $("#timetable").on("click",".course",function(){
        id = $(this).attr("name");
        //id = parseInt(id);
        setCourseInfoModal(id);
        $('#CourseInfoModal').modal('show');
    });
    
    $("#AddCourseID").keypress(function(e){
        code = (e.keycode ? e.keycode : e.which);
        if (code==13){
            $("#AddCourseButton").click();
        }
    });

    $("#AddCourseButton").click(function(){
        id = $("#AddCourseID").val();
        if(id==""){
            alert("Please enter a course id");
            return ;
        }
        //id = parseInt(id);
        $("#AddCourseID").val("");
        AddCourse(id);
    });

    $("#CourseInfoModal-Delete").click(function(){
        id = $(this).attr("name");
        //id = parseInt(id);
        DeleteCourse(id);
        $('#CourseInfoModal').modal('hide');
    });
    
    $("#CourseInfoModal-ED").click(function(){
        id = $(this).attr("name");
        //id = parseInt(id);
        EnableDisableCourse(id);
        $('#CourseInfoModal').modal('hide');
    });

    $("#ShareButton").click(function(){
        shareLink();
    });

    $("#SharingModal-Viewself").click(function(){
        UsingShareData = false;
        load();
        showTable();
        $("#SharingModal").modal('hide');
    });

    $("#SharingModal-Import").click(function(){
        UsingShareData = false;
        save();
        window.location = `${location.protocol}//${location.host}${location.pathname}`;
    });

    $("#CopiedToast .toast-body").click(function(){
        window.open($("#CopiedToast .toast-body a").attr("href"));
    });

    document.body.classList.remove('loading')
});

async function changeSemester(year, sem){
    check = false;
    SemesterList.forEach(function(S){if(S[0]==year && S[1]==sem)check=true;});
    if(!check){
        return ;
    }
    document.body.classList.add('loading')
    $(`#semester-item-${Year}-${Semester}`).removeClass("active");
    save();
    Year = year;
    Semester = sem;
    AllCourse = await fetch(`data/${Year}${Semester}.json`).then(res => res.json());
    gentable();
    load();
    showTable();
    localStorage.setItem("LastYear", Year);
    localStorage.setItem("LastSemester", Semester);
    $("#semesterDropdownText").html(`${Year}-${Semester}`);
    $(`#semester-item-${Year}-${Semester}`).addClass("active");
    document.body.classList.remove('loading')
}
