var express = require('express');
var app = express();
const nodemailer = require('nodemailer');
var router = express.Router();
var db = require('../config')
var http = require('http');
// var io = require(‘socket.io’)(http);
const server = http.createServer(app);
var io = require('socket.io')(server);
var weburl = "http://localhost:3000/";


let transport = nodemailer.createTransport({
    host: 'mail.vishwasworld.com',
    port: 587,
    auth: {
       user: 'support@vishwasworld.com',
       pass: 'RxGD2dg*g'
    }
});

router.post('/updateSocket', (req, res) => {
    res.io.emit('update task', { userIds: req.body.user_id, is_test_accepted: '', type: req.body.type, senderIds: req.body.sender_id, });
    res.send({ message: 'success', code: 200 });
});
router.post('/addUser', (req, res) => {
	var wallet = generateWalletId();
	var str = makeid(16);
    var new_user = {
        user_secret: req.body.password,
        email: req.body.email,
		walletid:wallet,
		verification_code:str
    }
    var sql = `insert into mst_users SET  ?`
    db.query(sql, new_user, (error, result) => {
        if (error) {
            //res.send('Getting Error' + error)
			res.send({ message:error});
        } else {
			var name = req.body.email;
			var link1 = weburl+"session/signup-verification?verificationCode="+str;
			getWelcomeEmail(name,link1);
            res.send({ data: result,message:'Registered Successfully! The wallet id has been sent your email address' });
        }
    })
})

function executeQuery(sql,sqlData)
{
	var res = "";
	db.query(sql, sqlData, (error, result) => {
    })
}

router.post('/userLogin', (req, res) => {
	var user_secret = req.body.password;
    var email = req.body.wallet;
    var sql = "select first_name as fullName,profile_image as avatar,walletid,mst_userid as userid from mst_users WHERE user_secret='"+user_secret+"' AND walletid='"+email+"' AND user_status=1";
	console.log(sql);
    db.query(sql, (error, result) => {
        if (error) {
            res.send({message:'Getting Error' + error})
        } else {
			if(result.length > 0)
			{
				res.send({ data: result[0],message:"Login Successfull" })
			}else{
				res.send({message:"Invalid wallet id or password"})
			}
            
        }
    })
})

router.get('/getProfile/:id', (req, res) => {

    var sql = "select first_name as fullName,first_name,profile_image as avatar,walletid,mst_userid as userid,email,address,country,idproof_type,mobile,dob,idproof_front,idproof_back,addproof_type,addproof_front, sms_noti,email_noti,wallet_language from mst_users WHERE mst_userid='"+req.params.id+"'";
	console.log(sql);
    db.query(sql, (error, result) => {
        if (error) {
            res.send({message:'Getting Error' + error})
        } else {
			if(result.length > 0)
			{
				res.send({ data: result[0],message:"Login Successfull" })
			}else{
				res.send({message:"Invalid wallet id or password"})
			}
            
        }
    })
});

router.post('/verifyEmail/:id', (req, res) => {
	
    var sql = "select mst_userid from mst_users where user_status = 0 and verification_code='"+req.params.id+"'";
	console.log(sql);
    db.query(sql, (error, result) => {
        if (error) {
            res.send({status:false,message:'Getting Error' + error})
        } else {
			if(result.length > 0)
			{
				
				 var user_profile = {
					user_status	: 1
				}
				var sql1 = "update mst_users SET ? where verification_code='"+req.params.id+"'";
				executeQuery(sql1,user_profile);
				
				res.send({ status: true,message:"Your account verified successfully" });
			}else{
				res.send({status:false,message:"Invalid Link"});
			}
            
        }
    })
});

router.post('/changepassword/:id', (req, res) => {
    var user_profile = {
        user_secret: req.body.npassword
    }
    var sql = `update mst_users SET ? where mst_userid=${req.params.id}`
    db.query(sql, user_profile, (error, result) => {
        if (error) {
            res.send({message:'Getting Error' + error})
        } else {
            res.send({ message: "Password updated successfully" })
        }
    })
})


router.post('/forgotPassword', (req, res) => {
	
    var sql = "select mst_userid from mst_users where email='"+req.body.email+"'";
	console.log(sql);
    db.query(sql, (error, result) => {
        if (error) {
            res.send({status:false,message:'Getting Error' + error})
        } else {
			if(result.length > 0)
			{
				var str = makeid(16);
				 var user_profile = {
					user_id	: result[0].mst_userid,
					act_code:str
				}
				var sql1 =`insert into forgot_password SET  ?`;
				executeQuery(sql1,user_profile);
				var link1 = weburl+"session/reset-password?id="+str;
				getForgotEmail(req.body.email,link1);
				res.send({ status: true,message:"Reset password link sent your email address" });
			}else{
				res.send({status:false,message:"Invalid Link"});
			}
            
        }
    })
})

router.post('/fotgotLinkVerify/:id', (req, res) => {
	
    var sql = "select user_id from forgot_password where act_code='"+req.params.id+"' AND status = 0";
	console.log(sql);
    db.query(sql, (error, result) => {
        if (error) {
            res.send({status:false,message:'Getting Error' + error})
        } else {
			if(result.length > 0)
			{		
				 var user_profile = {
					status	: 1
				}
				
				res.send({ status: true});
			}else{
				res.send({status:false,message:"Invalid Link"});
			}
            
        }
    })
});

router.post('/resetPassword', (req, res) => {
    
    var sql = "select user_id from forgot_password where act_code='"+req.body.token+"' AND status = 0";
    db.query(sql, (error, result) => {
        if (error) {
            res.send({status:false,message:'Getting Error' + error})
        } else {
			if(result.length > 0)
			{	
				var user_profile = {
					user_secret: req.body.newPassword
				}
				var sql1 = "update mst_users SET ? where mst_userid='"+result[0].user_id+"'";	
				executeQuery(sql1,user_profile);
				var user_profile1 = {
					status: 1
				}
				var sql1 =`update forgot_password SET  ? where user_id = `+result[0].user_id;
				executeQuery(sql1,user_profile1);
				res.send({ status: true,message:"Password has been updated successfully"});
			}else{
				res.send({status:false,message:"Invalid Link"});
			}
            
        }
    })
})
router.post('/updateProfile/:id', (req, res) => {
    var user_profile = {
        first_name: req.body.first_name,
        address: req.body.address,
        country: req.body.country,
		mobile: req.body.mobile,
        dob: req.body.dob

    }
    var sql = `update mst_users SET ? where mst_userid=${req.params.id}`
    db.query(sql, user_profile, (error, result) => {
       if (error) {
            res.send({message:'Getting Error' + error})
        } else {
            res.send({ message: "Profile updated successfully" })
        }
    })
})

router.put('/updateKyc/:id', (req, res) => {
    var user_profile = {
        idproof_type: req.body.idproof_type,
        idproof_front: req.body.idproof_front,
        idproof_back: req.body.idproof_back,
        addproof_type: req.body.addproof_type,
        addproof_front: req.body.addproof_front

    }
    var sql = `update mst_users SET ? where mst_userid=${req.params.id}`
    db.query(sql, user_profile, (error, result) => {
        if (error) {
            res.send('Getting Error' + error)
        } else {
            res.send({ data: result })
        }
    })
})
router.post('/profilefile', async (req, res) => {
	try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let avatar = req.files.avatar;
            
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            avatar.mv('./public/' + avatar.name);
			var user_profile = "";
			var uid = req.body.uid;
			console.log(uid);
			var user_profile = {
				profile_image: avatar.name
			}
			 
			var sql = `update mst_users SET ? where mst_userid=${uid}`
			db.query(sql, user_profile, (error, result) => {
				if (error) {
					res.send('Getting Error' + error)
				} else {
					 //send response
					res.send({
						status: true,
						message: 'Profile image updated ',
						data: {
							name: "http://localhost:8080/"+avatar.name,
							mimetype: avatar.mimetype,
							size: avatar.size
						}
					});
				}
			});
           
        }
    } catch (err) {
        res.status(500).send(err);
    }
});
router.post('/uploadfile/:id', async (req, res) => {
	try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let avatar = req.files.avatar;
            
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            avatar.mv('./public/' + avatar.name);
			var user_profile = "";
			var uid = req.body.uid;
			console.log(uid);
			if(req.params.id == 1)
			{
				var user_profile = {
					idproof_type: req.body.idproof,
					idproof_front: avatar.name
				}
			}else if(req.params.id == 2){
				var user_profile = {
					idproof_type: req.body.idproof,
					idproof_back: avatar.name
				}
			}else{
				var user_profile = {
					addproof_type: req.body.idproof,
					addproof_front: avatar.name
				}
			}
			 
			var sql = `update mst_users SET ? where mst_userid=${uid}`
			db.query(sql, user_profile, (error, result) => {
				if (error) {
					res.send('Getting Error' + error)
				} else {
					 //send response
					res.send({
						status: true,
						message: 'File is uploaded',
						data: {
							name: "http://localhost:8080/"+avatar.name,
							mimetype: avatar.mimetype,
							size: avatar.size
						}
					});
				}
			});
           
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/send_plain_mail', function(req, res) {
		console.log('sending email..');
		const message = {
	    from: 'support@vishwasworld.com', // Sender address
	    to: 'p.murugan103@gmail.com',         // recipients
	    subject: 'test mail from Nodejs', // Subject line
	    text: 'Successfully! received mail using nodejs' // Plain text body
	};
	transport.sendMail(message, function(err, info) {
	    if (err) {
		  res.send('Getting Error :'+err);
	    }else{
	      res.send('Getting Success :'+info);
	    }
	});
	res.send('Getting Error');
});
function getForgotEmail(name,link1)
{
	var email = '<table id="bodyTable" border="0" width="100%" cellspacing="0" cellpadding="0" align="center" bgcolor="#f3f3f3"><tbody><tr><td id="bodyCell" align="center" valign="top"><table class="templateContainer" style="max-width: 700px; padding: 20px 10px;" border="0" width="100%" ellspacing="0" cellpadding="0"><tbody><tr><td id="templateHeader" style="padding: 0px 0 15px 0;" align="center" valign="top"><div style="padding: 0;"><img height="100" width="100" src="https://exchange-y9nd8.ondigitalocean.app/static/media/2local logo wht.67c3f541.svg" alt="2Local logo" /></div></td></tr><tr><td style="border-radius: 8px;" align="center" valign="top" bgcolor="#ffffff"><table class="moilecenre" border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr><td class="mobilesp" style="padding: 40px 50px 0 50px;" valign="top"><div><h2 style="text-align: center; margin: 0px 0 20px 0; color: #303030; font-weight: 400; font-size: 28px; line-height: 32px;">Password Reset - 2Local</h2><p style="margin: 10px 0 20px 0; color: #58585a; font-weight: 400; font-size: 16px; line-height: 22px;">Hi '+name+',<br /><br />  Please click bellow button to reset your password. <br /><br /><p style="margin: 10px 0px 0px; color: #58585a; font-weight: 400; font-size: 16px; line-height: 22px; text-align: center;"><span style="background: transparent linear-gradient(180deg,#53a8f0,#2d7fc4) 0 0 no-repeat padding-box; color: #fff!important; display: inline-block; font-family: inherit; font-weight: 500; border: 0; border-radius: 5px; white-space: nowrap; padding: 1rem 1.5rem; line-height: 1.4; text-align: center; -webkit-transition: .07s; transition: .07s; position: relative;"><span class="mc-toc-title"><a style="color: #ffffff; text-decoration: none;" href="'+link1+'">Reset Password</a></span></span></p></div></td></tr><tr><td class="mobiletem" style="padding: 10px 50px 40px 50px;" valign="top"><div><p style="color: #58585a; margin: 0; font-size: 17px; line-height: 22px;">Thanks,<br />2Local Team</p></div></td></tr></tbody></table></td></tr><tr><td id="templateFooter" valign="top"><table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr><td style="padding: 22px 10px 22px 10px;" align="center" valign="top"><p style="font-size: 15px; margin: 0 0 0px 0; color: #d42464; text-align: center; font-weight: 300;" align="center"><a style="color: #0EC167; font-weight: 300; text-decoration: none; padding: 0 5px 0 0;" target="_blank" href="https://exchange-y9nd8.ondigitalocean.app/">2Local</a></p></td></tr></tbody></table></td> </tr></tbody> </table></td></tr></tbody></table>';
	const message = {
	    from: 'support@vishwasworld.com', // Sender address
	    to: name,         // recipients
	    subject: 'Email Verification - 2Local', // Subject line
	    html: email // Plain text body
	};
	transport.sendMail(message, function(err, info) {
	   
	});	
}
function getWelcomeEmail(name,link1)
{
	var email = '<table id="bodyTable" border="0" width="100%" cellspacing="0" cellpadding="0" align="center" bgcolor="#f3f3f3"><tbody><tr><td id="bodyCell" align="center" valign="top"><table class="templateContainer" style="max-width: 700px; padding: 20px 10px;" border="0" width="100%" ellspacing="0" cellpadding="0"><tbody><tr><td id="templateHeader" style="padding: 0px 0 15px 0;" align="center" valign="top"><div style="padding: 0;"><img height="100" width="100" src="https://exchange-y9nd8.ondigitalocean.app/static/media/2local logo wht.67c3f541.svg" alt="2Local logo" /></div></td></tr><tr><td style="border-radius: 8px;" align="center" valign="top" bgcolor="#ffffff"><table class="moilecenre" border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr><td class="mobilesp" style="padding: 40px 50px 0 50px;" valign="top"><div><h2 style="text-align: center; margin: 0px 0 20px 0; color: #303030; font-weight: 400; font-size: 28px; line-height: 32px;">Welcome to 2Local</h2><p style="margin: 10px 0 20px 0; color: #58585a; font-weight: 400; font-size: 16px; line-height: 22px;">Hi '+name+',<br /><br /> Welcome to 2Local. You need to take one more step to access your wallet. To activate your account, we need to verify if its actually your email address: <br /><br /><p style="margin: 10px 0px 0px; color: #58585a; font-weight: 400; font-size: 16px; line-height: 22px; text-align: center;"><span style="background: transparent linear-gradient(180deg,#53a8f0,#2d7fc4) 0 0 no-repeat padding-box; color: #fff!important; display: inline-block; font-family: inherit; font-weight: 500; border: 0; border-radius: 5px; white-space: nowrap; padding: 1rem 1.5rem; line-height: 1.4; text-align: center; -webkit-transition: .07s; transition: .07s; position: relative;"><span class="mc-toc-title"><a style="color: #ffffff; text-decoration: none;" href="'+link1+'">Verify Email</a></span></span></p></div></td></tr><tr><td class="mobiletem" style="padding: 10px 50px 40px 50px;" valign="top"><div><p style="color: #58585a; margin: 0; font-size: 17px; line-height: 22px;">Thanks,<br />2Local Team</p></div></td></tr></tbody></table></td></tr><tr><td id="templateFooter" valign="top"><table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr><td style="padding: 22px 10px 22px 10px;" align="center" valign="top"><p style="font-size: 15px; margin: 0 0 0px 0; color: #d42464; text-align: center; font-weight: 300;" align="center"><a style="color: #0EC167; font-weight: 300; text-decoration: none; padding: 0 5px 0 0;" target="_blank" href="https://exchange-y9nd8.ondigitalocean.app/">2Local</a></p></td></tr></tbody></table></td> </tr></tbody> </table></td></tr></tbody></table>';
	const message = {
	    from: 'support@vishwasworld.com', // Sender address
	    to: name,         // recipients
	    subject: 'Email Verification - 2Local', // Subject line
	    html: email // Plain text body
	};
	transport.sendMail(message, function(err, info) {
	   
	});	
}
function Changed(pre, now) {
    if(pre.length!=now.length)
        return true;
    else
        return false
    // return true if pre != now
}
function generateWalletId()
{
	var str = makeid(8);

	for(var i = 1; i < 5;i++)
	{
		if(i < 4){
			str = str + "-" + makeid(4);
		}else{
			str = str + "-" + makeid(12);
		}
	}
	return str;
}
function makeid(length) {
   var result           = '';
   var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
router.post('/getAssignStatus',(req,res) => {
    var query = db.query(`select test_assign_id AS assign_status from test_assign where inst_id= ${req.body.inst_id} AND ${req.body.type}= ${req.body.id} AND user_id= ${req.body.user_id}` ,
        function(error,result){
            if(error){
                res.send({response: error});
            }else{
                if(result.length<1){
                res.send({response :{assign_status: true}});
                }else{
                res.send({response :{assign_status: false}});
                }
            }
        });
});

module.exports = router;

