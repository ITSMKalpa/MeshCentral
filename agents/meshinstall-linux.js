/*
Copyright 2020 Intel Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*
TODO: in msh, when:
InstallFlags=1    --> Interactive only, show connect button, not install/uninstal.
InstallFlags=2    --> Background only, show only install/uninstal, not connect.
*/

var msh = {};
var s = null;
try { s = require('service-manager').manager.getService('meshagent'); } catch (e) { }

var buttons = ["Connect", "Cancel"];
if (s) {
    buttons.unshift("Uninstall");
    buttons.unshift("Update");
} else {
    buttons.unshift("Install");
}

if ((require('message-box').zenity == null) || (!require('message-box').zenity.extra)) {
    console.log('\n' + "This installer cannot run on this system.");
    console.log("Try installing/updating Zenity, and run again." + '\n');
    process.exit();
}

if (!s) {
    msg = "Agent: " + "NOT INSTALLED" + '\n';
} else {
    msg = "Agent: " + (s.isRunning() ? "RUNNING" : "NOT RUNNING") + '\n';
}
msg += ("Device Group: " + msh.MeshName + '\n');
msg += ("Server URL: " + msh.MeshServer + '\n');

var p = require('message-box').create("MeshCentral Agent Setup", msg, 99999, buttons);
p.then(function (v) {
    switch (v) {
        case "Cancel":
            process.exit();
            break;
        case "Connect":
            global._child = require('child_process').execFile(process.execPath,
                [process.execPath.split('/').pop(), '--no-embedded=1', '--disableUpdate=1',
                    '--MeshName="' + msh.MeshName + '"', '--MeshType="' + msh.MeshType + '"',
                    '--MeshID="' + msh.MeshID + '"',
                    '--ServerID="' + msh.ServerID + '"',
                    '--MeshServer="' + msh.MeshServer + '"',
                    '--AgentCapabilities="0x00000020"']);

            global._child.stdout.on('data', function (c) { });
            global._child.stderr.on('data', function (c) { });
            global._child.on('exit', function (code) { process.exit(code); });

            msg = ("Device Group: " + msh.MeshName + '\n');
            msg += ("Server URL: " + msh.MeshServer + '\n');

            var d = require('message-box').create("MeshCentral Agent", msg, 99999, ["Disconnect"]);
            d.then(function (v) { process.exit(); }).catch(function (v) { process.exit(); });
            break;
        case "Uninstall":
            global._child = require('child_process').execFile(process.execPath,
                [process.execPath.split('/').pop(), '-fulluninstall', '--no-embedded=1']);

            global._child.stdout.on('data', function (c) { process.stdout.write(c.toString()); });
            global._child.stderr.on('data', function (c) { process.stdout.write(c.toString()); });
            global._child.waitExit();
            process.exit();
            break;
        case "Install":
        case "Update":
            var mstr = require('fs').createWriteStream(process.execPath + '.msh', { flags: 'wb' });
            mstr.write('MeshName=' + msh.MeshName + '\n');
            mstr.write('MeshType=' + msh.MeshType + '\n');
            mstr.write('MeshID=' + msh.MeshID + '\n');
            mstr.write('ServerID=' + msh.ServerID + '\n');
            mstr.write('MeshServer=' + msh.MeshServer + '\n');
            mstr.end();

            global._child = require('child_process').execFile(process.execPath,
                [process.execPath.split('/').pop(), '-fullinstall', '--no-embedded=1', '--copy-msh=1']);

            global._child.stdout.on('data', function (c) { process.stdout.write(c.toString()); });
            global._child.stderr.on('data', function (c) { process.stdout.write(c.toString()); });
            global._child.waitExit();
            process.exit();
            break;
        default:
            console.log(v);
            process.exit();
            break;
    }
}).catch(function (e) {
    process.exit();
});
