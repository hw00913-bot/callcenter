(() => {
    const lead = (number, name, fields) => ({
        id: "L-" + number,
        name,
        phone: "1700000" + number,
        category: "留资线索",
        source: "本司业务系统",
        originalKey: "C-" + number,
        tenant: "总部",
        demoTask: true,
        needsNurture: true,
        requiredMode: "人工外呼",
        intakeState: "已接收",
        taskId: "T-" + number,
        taskStatus: "待跟进",
        ownerId: "S-101",
        assignedOn: "2026-11-07",
        followupResult: "",
        followupNote: "",
        nextAt: "",
        decision: "",
        handoffState: "",
        ...fields
    });

    window.reviewSample = {
        role: "operator",
        tenant: "总部",
        seatId: "S-101",
        today: "2026-11-07",
        changes: [],
        seats: [
            {id:"S-101",name:"张嘉宁",tenant:"总部",account:"zhang.jn",employeeNo:"8011",workWeChat:"wx-8011",quotaMin:3,quotaMax:8,newCount:3,followCount:2,enabled:true},
            {id:"S-102",name:"周文杰",tenant:"总部",account:"zhou.wj",employeeNo:"8012",workWeChat:"wx-8012",quotaMin:3,quotaMax:5,newCount:3,followCount:2,enabled:true},
            {id:"S-103",name:"陈思远",tenant:"总部",account:"chen.sy",employeeNo:"8013",workWeChat:"",quotaMin:2,quotaMax:6,newCount:1,followCount:1,enabled:true},
            {id:"S-104",name:"林雨桐",tenant:"总部",account:"lin.yt",employeeNo:"8014",workWeChat:"",quotaMin:null,quotaMax:null,newCount:0,followCount:0,enabled:true},
            {id:"S-205",name:"何初晴",tenant:"示例门店",account:"he.cq",employeeNo:"9015",workWeChat:"",quotaMin:2,quotaMax:6,newCount:2,followCount:0,enabled:true}
        ],
        schedules: {
            "S-101":{"2026-11-05":"早班","2026-11-06":"早班","2026-11-07":"早班","2026-11-08":"休息","2026-11-09":"中班","2026-11-10":"晚班"},
            "S-102":{"2026-11-07":"早班","2026-11-08":"晚班"},
            "S-103":{"2026-11-07":"休息","2026-11-08":"中班"},
            "S-205":{"2026-11-07":"早班"}
        },
        records: [
            lead(1028,"李女士"),
            lead(1029,"郑先生",{category:"培育线索",source:"第三方培育系统",originalKey:"H-1029",taskStatus:"下次回访",assignedOn:"2026-11-06",followupResult:"下次回访",followupNote:"客户希望再了解车型和到店安排。",nextAt:"2026-11-07T15:00"}),
            lead(1031,"唐先生",{category:"培育线索",source:"第三方培育系统",originalKey:"H-1031",requiredMode:"预外呼",taskStatus:"待接听",ownerId:"",assignedOn:""}),
            lead(1032,"宋女士",{needsNurture:false,taskStatus:"已完成",followupResult:"下发门店",followupNote:"确认有到店意向。",decision:"是",handoffState:"待交回"}),
            lead(1033,"罗先生",{category:"培育线索",source:"第三方培育系统",originalKey:"H-1033",taskStatus:"已完成",ownerId:"S-102",assignedOn:"2026-11-06",followupResult:"下发门店",followupNote:"确认希望由当地门店联系。",decision:"是",handoffState:"待交回"}),
            lead(1035,"孙先生",{needsNurture:false,taskStatus:"已完成",followupResult:"战败",followupNote:"客户已通过其他渠道购车。",decision:"否",handoffState:"待结案"}),
        ]
    };
})();
