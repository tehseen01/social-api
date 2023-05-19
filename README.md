# Social API

This repository contains the backend API for a social media application. It provides the necessary endpoints and functionalities to create, retrieve, update, and delete user profiles, posts, likes and comments.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Installation

To set up the backend API locally, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/tehseen01/social-api.git
```

2. Change into the project directory:

```bash
cd social-api
```

3. Install the required dependencies using yarn:

```bash
yarn install
```

4. Create a `.env` file in the root directory and provide the following environment variables:

```plaintext
PORT = 8080
MONGO_URL = <mongodb_connection_uri>
JWT_SECRET = <jwt_secret_key>

SMPT_USER = <smpt-gmail>
SMPT_PASSWORD = <smpt-gmail-password>

CLOUDINARY_NAME= <your-cloudinary-name>
CLOUDINARY_API_KEY = <your-cloudinary-api-key>
CLOUDINARY_API_SECRET = <your-coudinary-api-secret>

```

5. Start the server:

```bash
yarn start
```

The API should now be running on the specified port.

## Usage

Once the server is up and running, you can interact with the API using a tool like [Postman](https://www.postman.com/) or by making HTTP requests from your preferred client.

Make sure to refer to the [Endpoints](#endpoints) section for the available API routes and their corresponding request formats.

## Endpoints

The following endpoints are available in the API:


- **Auth Endpoints:**

  - `POST /api/auth/register` - Register a new user
  - `POST /api/auth/login` - User login
  - `GET /api/auth/logout` - User logout
  - `POST /api/auth/forgot/password` - Forgot password


- **User Endpoints:**
 
  - `GET /api/user/me` - Get profile
  - `GET /api/user/:idOrUsername` - Get user profile
  - `PUT /api/user/profile` - Update user profile
  - `DELETE /api/user/delete/me` - Delete user profile

- **Post Endpoints:**
  - `POST /api/posts` - Create a new post
  - `GET /api/posts` - Get all posts
  - `GET /api/posts/post/:postId` - Get a specific post
  - `PUT /api/posts/:postId` - Update a post
  - `DELETE /api/posts/:postId` - Delete a post

- **Comment Endpoints:**
  - `POST /api/posts/comment/:id` - Add a comment to a post
  - `DELETE /api/posts/comment/:commentId` - Delete a comment

For detailed information on the request and response formats for each endpoint, refer to the API documentation or inspect the codebase.

## Authentication

Authentication is handled using JSON Web Tokens (JWT). To access protected routes, include the JWT token in the `Authorization` header of your requests. The token can be obtained by logging in or registering a new user.

## Error Handling

The API follows RESTful conventions and returns appropriate HTTP status codes and error messages in case of failures. Error handling is implemented to provide informative responses when errors occur.

## Contributing

Contributions to this API are welcome! If you find any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE). Feel free to use and modify the code as per the terms of the license.
