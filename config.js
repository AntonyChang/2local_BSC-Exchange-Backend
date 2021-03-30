var mysql = require('mysql')
var db = mysql.createConnection({
    host:'localhost',
    // ----------------For live start--------------------
		'user' : 'root',
		'password' : '',
		'database' : 'digitalex1',
	// ----------------For live end----------------------

    // ----------------For live Testing app start--------------------
	//	'user' : 'debian-sys-maint',
	//	'password' : 'x3YOwXm7UnQz5t2v',
	//	'database' : 'gems_global_test',
	// ----------------For live Testing app end----------------------

    // ----------------For local start--------------------
    //   user:'root',
    //   password:'',
    //   database:'gems_demo'
	// ----------------For local end----------------------

})
module.exports = db;
