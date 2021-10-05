const { v4: uuidv4 } = require('uuid');

let users = [];
let posts = [
    {
        id: 25280,
        ownerId: 11,
        title: "string",
        description: "string",
        category: "cars",
        location: "helsinki",
        images: [
          "string"
        ],
        price: 0,
        date: "2020-08-24",
        deliveryType: "pickup",
        contactInfo: "Krisu, 04569569823"
      },
      {
        id: 15690,
        ownerId: 11,
        title: "string",
        description: "string",
        category: "toys",
        location: "helsinki",
        images: [
          "string"
        ],
        price: 0,
        date: "2019-08-24",
        deliveryType: "pickup",
        contactInfo: "Jukka, 05040569211"
      },
      {
        id: 23250,
        ownerId: 18,
        title: "string",
        description: "string",
        category: "toys",
        location: "oulu",
        images: [
          "string"
        ],
        price: 0,
        date: "2021-08-24",
        deliveryType: "pickup",
        contactInfo: "Pirkko, 04036569283"
      }
]


module.exports = {
    addUser: (user) => {
      user.id = uuidv4();
      users.push(user);
    },
    getUsers: () => {
      return users;
    },
    // look for a user if it exists
    getUserByName: (username) => users.find(user => user.username == username),

    addPost: (post) => {
      const postWithId = { id: uuidv4(), ...post};
      posts.push(postWithId);
    },
    // search posts
    getPostById: (postId) => posts.find(post => post.id == postId),

    getPostByCriteria: (criteria) => posts.filter(criteriaCheck(criteria)),
    
    // sorting???
    sortPostsByDate: (list) => list.sort((a, b) => {
        console.log(new Date(a.date) + "  --  " +  new Date(b.date))
        return new Date(b.date) - new Date(a.date);
    }),

    updatePostById: (postId, updatedProps) => {
      const post = module.exports.getPostById(postId);
      const newPost = {...post, ...updatedProps};
      console.log(JSON.stringify(newPost));
      module.exports.deletePostById(postId);
      posts.push(newPost);
    },

    deletePostById: (postId) => {
      for (let i = 0; i < posts.length; i++) {
        if (posts[i].id == postId) {
          posts.splice(i, 1);
          break;
        }
      }
    }
}

const criteriaCheck = (criteria) => {
    return (post) => {
        console.log("\nComparing new post...")
        let isValid = true;
        for (let prop in criteria) {
            if (prop == "sortByDate" || criteria[prop] == undefined) continue;
            console.log("criteria[" + prop + "] = " + criteria[prop] + ", post[" + prop + "] = " + post[prop]);
            if (post[prop] != criteria[prop]) {
                isValid = false;
                break;
            }
        }
        isValid ? console.log("Valid post found!") : console.log("POST NOT FOUND >:(");
        return isValid;
    }
}

/* 

criteria = {
    category: null or string,
    location: null or string,
    sortByDate: true or false,
    username: null or string
}

*/