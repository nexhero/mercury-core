
# Table of Contents

1.  [Mercury Core](#org5d50e4b)
2.  [Installation](#org71937b7)
3.  [NPM package](#orgb3cbc8a)
4.  [Generating documentation](#org831a298)
5.  [Examples.](#org8be0e92)
    1.  [Initialize Database](#orga553a18)
    2.  [Share local repository](#org23fb76b)
    3.  [Append other repository](#org3964617)
    4.  [Remove repository](#orga5ce446)
    5.  [Create Document](#org518f4bb)
    6.  [CRUD.](#orgb39cdaf)
6.  [License](#orgc269e3c)
7.  [Contact](#org6635db3)
8.  [Additional Resources](#org163ff8c)


<a id="org5d50e4b"></a>

# Mercury Core

**Mercury Core** is a Network and Storage manager for the [Mercury Note App](https://github.com/nexhero/mercury) . This repository provides the core functionality that powers Mercury&rsquo;s decentralized storage and networking capabilities.

**Features**

-   Network Management: Handling of peer-to-peer connections.
-   Storage Management: Use hyperbee and autobase for data storage.


<a id="org71937b7"></a>

# Installation

To get started, clone this repository and install the dependencies:

    git clone https://github.com/nexhero/mercury-core.git
    cd mercury-core
    npm install


<a id="orgb3cbc8a"></a>

# NPM package

    npm i mercury-core


<a id="org831a298"></a>

# Generating documentation

    jsdoc -c jsdoc.json
    open docs/index.html


<a id="org8be0e92"></a>

# Examples.


<a id="orga553a18"></a>

## Initialize Database

A [Corestore](https://github.com/holepunchto/corestore) is required for mercury to save documents.

    const store = new Corestore('./temp_store.db');
    const mercury = new Mercury(store);
    await mercury.initialize(); //wait until storage is ready
    mercury.listen(); //Listen for connections


<a id="org23fb76b"></a>

## Share local repository

    const channel = mercury.encodeRepository();
    console.log('Repository channel:',channel);


<a id="org3964617"></a>

## Append other repository

    mercury.joinRemoteRepository(channel,'desktop')
        .then((msg)=>console.log(msg))
        .catch((err)=>console.log(`Unable to append repository ${String(err)}`))


<a id="orga5ce446"></a>

## Remove repository

    const id = 'abc';
    mercury.removeRepository(id)
        .then(()=>console.log('Repository has been removed'))
        .catch((err)=>console.log(`Unable to remove repository ${String(err)}`));


<a id="org518f4bb"></a>

## Create Document

    const doc = mercury.createDocument('BASE');
    doc.setLabel('This is a document');
    doc.setContent('<p>Hello world</p>');
    doc.save()


<a id="orgb39cdaf"></a>

## CRUD.

    mercury.db.getAllDocuments();
    mercury.db.getDocument(id);
    mercury.db.removeDocument(id);


<a id="orgc269e3c"></a>

# License

This project is licensed under the MIT License


<a id="org6635db3"></a>

# Contact

For questions or support, reach out to the repository maintainers via [GitHub Issues](https://github.com/nexhero/mercury-core/issues).


<a id="org163ff8c"></a>

# Additional Resources

-   [Corestore](https://github.com/holepunchto/corestore)
-   [Hyperswarm](https://github.com/holepunchto/hyperswarm)
-   [Hyperbee](https://github.com/holepunchto/hyperbee)
-   [Autobase](https://github.com/holepunchto/autobase)

