var values = {};
var clockCycle24 = 0;

function init()
{
    cacheValues();
}

function cacheValues()
{
    values.lastPath = local.values.lastMessage.path;
    values.lastArgCount = local.values.lastMessage.argCount;
    values.lastArg1 = local.values.lastMessage.arg1;
    values.lastArg2 = local.values.lastMessage.arg2;
    values.lastArg3 = local.values.lastMessage.arg3;
    values.lastArg4 = local.values.lastMessage.arg4;

    values.cv1 = local.values.cv.cv1;
    values.cv2 = local.values.cv.cv2;
    values.cv3 = local.values.cv.cv3;
    values.cv4 = local.values.cv.cv4;

    values.trig1 = local.values.triggers.trig1;
    values.trig2 = local.values.triggers.trig2;

    values.cue = local.values.state.cue;

    values.midiNotePlayed = local.values.midi.infos.notePlayed;
    values.midiOneNoteOn = local.values.midi.infos.oneNoteOn;
    values.midiLastChannel = local.values.midi.infos.lastChannel;
    values.midiLastPitch = local.values.midi.infos.lastPitch;
    values.midiLastVelocity = local.values.midi.infos.lastVelocity;

    values.midiClock = local.values.midi.tempo.clock;
    values.midiBeatClock = local.values.midi.tempo.beatClock;
    values.midiBeatClockCounter = local.values.midi.tempo.beatClockCounter;
    values.midiStartTrigger = local.values.midi.tempo.start;
    values.midiStopTrigger = local.values.midi.tempo.stop;
    values.midiContinueTrigger = local.values.midi.tempo["continue"];
    values.midiProgram = local.values.midi.programChange.program;
    values.midiCc = local.values.midi.cc;

    values.midiMtcTime = local.values.midi.mtc.mtcTime;
    values.midiIsMtcPlaying = local.values.midi.mtc.isMtcPlaying;
    values.midiSongPos = local.values.midi.mtc.songPos;
    values.mtcQfPiece = local.values.midi.mtc.mtcQfPiece;
    values.mtcQfValue = local.values.midi.mtc.mtcQfValue;

    clockCycle24 = parseInt(toNumber(values.midiBeatClockCounter.get()));
}

function oscEvent(address, args)
{
    updateLastMessage(address, args);

    if (address == "/cv/1" && args.length > 0) { values.cv1.set(toNumber(getArg(args, 0))); return; }
    if (address == "/cv/2" && args.length > 0) { values.cv2.set(toNumber(getArg(args, 0))); return; }
    if (address == "/cv/3" && args.length > 0) { values.cv3.set(toNumber(getArg(args, 0))); return; }
    if (address == "/cv/4" && args.length > 0) { values.cv4.set(toNumber(getArg(args, 0))); return; }

    if (address == "/trig/1" && args.length > 0) { values.trig1.set(toBool(getArg(args, 0))); return; }
    if (address == "/trig/2" && args.length > 0) { values.trig2.set(toBool(getArg(args, 0))); return; }

    if (address == "/cue" && args.length > 0) { values.cue.set(parseInt(toNumber(getArg(args, 0)))); return; }
    if (address == "/pong") { return; }

    if (address == "/note" && args.length >= 3)
    {
        var ch = parseInt(toNumber(getArg(args, 0)));
        var pitch = parseInt(toNumber(getArg(args, 1)));
        var vel = parseInt(toNumber(getArg(args, 2)));

        values.midiLastChannel.set(ch);
        values.midiLastPitch.set(pitch);
        values.midiLastVelocity.set(vel);
        values.midiOneNoteOn.set(vel > 0);
        values.midiNotePlayed.set("Ch " + ch + " - N " + pitch + " - V " + vel);
        return;
    }

    if (address == "/control" && args.length >= 3)
    {
        var ccChannel = parseInt(toNumber(getArg(args, 0)));
        var ccIndex = parseInt(toNumber(getArg(args, 1)));
        var ccValue = parseInt(toNumber(getArg(args, 2)));

        values.midiLastChannel.set(ccChannel);
        if (ccIndex >= 0 && ccIndex <= 127)
        {
            var ccKey = "cc" + ccIndex;
            if (values.midiCc[ccKey] !== undefined)
            {
                values.midiCc[ccKey].set(ccValue);
            }
        }
        return;
    }

    if (address == "/program" && args.length >= 2)
    {
        values.midiLastChannel.set(parseInt(toNumber(getArg(args, 0))));
        values.midiProgram.set(parseInt(toNumber(getArg(args, 1))));
        return;
    }

    if (address == "/pitch" && args.length >= 2)
    {
        values.midiLastChannel.set(parseInt(toNumber(getArg(args, 0))));
        return;
    }

    if (address == "/clock")
    {
        values.midiClock.set(!values.midiClock.get());

        clockCycle24 = (clockCycle24 + 1) % 24;
        values.midiBeatClockCounter.set(clockCycle24);
        if (clockCycle24 === 0)
        {
            values.midiBeatClock.set(!values.midiBeatClock.get());
        }

        return;
    }

    if (address == "/start")
    {
        clockCycle24 = 0;
        values.midiBeatClockCounter.set(0);
        values.midiIsMtcPlaying.set(true);
        fireValue(values.midiStartTrigger);
        return;
    }
    if (address == "/stop")
    {
        clockCycle24 = 0;
        values.midiBeatClockCounter.set(0);
        values.midiIsMtcPlaying.set(false);
        fireValue(values.midiStopTrigger);
        return;
    }
    if (address == "/continue")
    {
        values.midiIsMtcPlaying.set(true);
        fireValue(values.midiContinueTrigger);
        return;
    }

    if (address == "/songpos" && args.length > 0)
    {
        values.midiSongPos.set(parseInt(toNumber(getArg(args, 0))));
        return;
    }

    if (address == "/mtc" && args.length >= 5)
    {
        var hour = parseInt(toNumber(getArg(args, 0)));
        var minute = parseInt(toNumber(getArg(args, 1)));
        var second = parseInt(toNumber(getArg(args, 2)));
        var frame = parseInt(toNumber(getArg(args, 3)));
        var fps = parseInt(toNumber(getArg(args, 4)));
        var millis = 0;

        if (fps > 0)
        {
            millis = parseInt((frame * 1000) / fps);
        }

        values.midiMtcTime.set(pad2(hour) + ":" + pad2(minute) + ":" + pad2(second) + "." + pad3(millis));
        values.midiIsMtcPlaying.set(true);
        return;
    }

    if (address == "/mtc_qf" && args.length >= 2)
    {
        values.mtcQfPiece.set(parseInt(toNumber(getArg(args, 0))));
        values.mtcQfValue.set(parseInt(toNumber(getArg(args, 1))));
        values.midiIsMtcPlaying.set(true);
        return;
    }
}

function fireValue(value)
{
    if (value === null || value === undefined) { return; }

    if (value.trigger !== undefined)
    {
        value.trigger();
        return;
    }

    if (value.set !== undefined)
    {
        value.set(true);
        value.set(false);
    }
}

function pad2(value)
{
    var intValue = parseInt(value);
    if (intValue < 10) { return "0" + intValue; }
    return "" + intValue;
}

function pad3(value)
{
    var intValue = parseInt(value);
    if (intValue < 10) { return "00" + intValue; }
    if (intValue < 100) { return "0" + intValue; }
    return "" + intValue;
}

function updateLastMessage(address, args)
{
    values.lastPath.set(address);
    values.lastArgCount.set(args.length);

    values.lastArg1.set(argToString(args, 0));
    values.lastArg2.set(argToString(args, 1));
    values.lastArg3.set(argToString(args, 2));
    values.lastArg4.set(argToString(args, 3));
}

function argToString(args, index)
{
    if (index >= args.length) { return ""; }
    var value = getArg(args, index);
    return "" + value;
}

function getArg(args, index)
{
    if (index >= args.length) { return null; }

    var raw = args[index];
    if (raw === null || raw === undefined) { return raw; }

    if (typeof raw === "object")
    {
        if (raw.value !== undefined) { return raw.value; }
        if (raw.arg !== undefined) { return raw.arg; }
        if (raw.data !== undefined) { return raw.data; }
        if (raw.type === "T") { return true; }
        if (raw.type === "F") { return false; }
        if (raw.tag === "T") { return true; }
        if (raw.tag === "F") { return false; }
    }

    return raw;
}

function toNumber(value)
{
    if (typeof value === "number") { return value; }
    if (value === true) { return 1; }
    if (value === false) { return 0; }
    var n = parseFloat("" + value);
    if (isNaN(n)) { return 0; }
    return n;
}

function toBool(value)
{
    if (value === true) { return true; }
    if (value === false) { return false; }
    if (value === 1 || value === "1") { return true; }
    if (value === 0 || value === "0") { return false; }

    var s = ("" + value).toLowerCase();
    if (s == "t" || s == "true" || s == "on") { return true; }
    if (s == "f" || s == "false" || s == "off") { return false; }

    return toNumber(value) > 0;
}

function sendPing()
{
    local.send("/ping");
}

function sendMessage(text)
{
    local.send("/msg", text);
}

function sendCue(cue)
{
    local.send("/cue", cue);
}

function sendAOut(value)
{
    local.send("/aout", value);
}

function sendIdle(enabled)
{
    local.send("/idle", enabled);
}

function triggerIdle()
{
    local.send("/idle");
}