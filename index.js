'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
// var empty = require('is-empty');
const app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

let userWizardPairs = {}

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        if (!req.body.entry[0].messaging[i].message.is_echo) {
            let event = req.body.entry[0].messaging[i]
            let sender = event.sender.id
            if (event.message && event.message.text) {
                let text = event.message.text

                // if the sender is in a pair with a wizard/user already, just send messages directly
                if ( sender in userWizardPairs ) {
                        directBackAndForth(userWizardPairs[sender], text)
                }
                // otherwise, send new message to the wizards (if they're not a wizard) or spin up a pair if they are
                else {
                    if (sender !== "1275795099175001") {
                        startWizards(1275795099175001, sender, text.substring(0, 200))

                    } else {
                        let userid = text
                        createPair(sender,parseInt(userid))
                        // also letOtherWizardsKnow
                    }

                }

            }
            res.sendStatus(200)
        }
    }
})

const token = "EAACZAsYyWS2MBABlHAE96EfAUAIWtsVRz8eJzvgK2YDAQiyse849bM24AC7pmRaFnOwhQmpEFIV8CBZBH3kdaRFzZAP0JZAsQKw3YbOqMah4Rd6JYvKMjdypdpNEQ5j5aciwurZBTKnafnzGE2BkWXnuXvfg4LxDiLHoRHCbo6AZDZD"

function createPair(wizard,user) {
    userWizardPairs[wizard] = user
    userWizardPairs[user] = wizard
}

function startWizards(wizard, sender, text) {
    let messageData = { text: sender + "writes: " + text}
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:wizard},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function directBackAndForth(messageRecipient, text) {
    let messageData = { text:text}
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:messageRecipient},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}


