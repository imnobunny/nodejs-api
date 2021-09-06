# red
backend of an untitled project


### HEROKU DEPLOYMENT:

1. Heroku create
2. git remote -v 
3. git push heroku main

### Base Path: https://secure-crag-48354.herokuapp.com/api/v1

#### Users 

Description: GET ALL AVAILABLE USERS <br />
Method: GET<br />
Endpoint: `/users`

response: `{
  success: bool,
  users[]: string
}`

Description: GET USER BY ID <br />
Method: GET<br />
Endpoint: `/users/:_id`

response: `{
  success: bool,
  user[]: string
}`

Description: UPDATE USER DETAILS BY ID <br />
Method: PATCH<br />
Endpoint: `/users/update/:_id`

response: `{
  success: bool
}`

Description: DELETE USER BY ID <br />
Method: DELETE<br />
Endpoint: `/users/delete/:_id`

response: `{
  success: bool
}`



