import fs from 'fs';

const outfile = 'docs.md';
const args = process.argv.slice(2);
console.log(args);

const jsDocKeywords = [ 'type', 'function', 'param', 'returns', 'return' ];
const emptyBlock = ()=> ({ params:[], notes: [] });
const newBlockInCaseOfMissingBegin = true;

const jsDoc= [];

const isFilename = ()=> true

const looksLikeJsDoc = line=> 
  line.trim().startsWith('*')
  || line.trim().startsWith('/*')

const jsDocToLines = doc => {
  const types={};
  const blocks = [];
  const currentBlock = [];

  const lines = doc
    .split('\n')
    .filter(looksLikeJsDoc)
    .map((line, lineNo, doc)=> {
      let block=emptyBlock();
      line=line.trim();
      if (line.match(/\s*\/\*/)) {
        blocks.push(block);
        block=emptyBlock();
        return 'begin'
      }
      if (line.match(/\s*\*\//)) {
        blocks.push(block);
        block=emptyBlock();
        return 'end'
      }
      line=line.match(/\s*\*\s*(.*)/)[1];
      if (line.startsWith('@type') || line.startsWith('type')) {
        // do add type, remapping over doc from lineNo to '}' if necessary
        // NB non *... lines may have been filtered already by looksLikeJsDoc :(
      }      
      if (!line.startsWith('@'))
        return ({ note: line }) 
      if (line.startsWith('@function')) {
        if (block.function) {
          blocks.push(block);
          block=emptyBlock();
          // we'll return later
        }        
      }

      let returnPair={};
      const keyword=jsDocKeywords.find(keyword=> {
        const matchArr=line.match(new RegExp(/(@\s*)/.source+keyword+/\s*({(?<type>.*)})?\s*(?<content>.*)?/.source))
        return matchArr ?
          // returnPair[keyword]=matchArr.groups
          returnPair= [keyword,{ type: matchArr.groups.type, content: matchArr.groups.content } ]
          : false 
      }) 
      // console.log('>',keyword);
      // console.log('>',returnPair);
      if (keyword) {
        return returnPair
}
    })

    return lines


}

const linesToBlocks = lines => {
  if (!Array.isArray(lines))
    console.log("Expected Array - something's gotten twisted!");
  const blocks = lines.reduce((acc, el, idx, arr)=> {
    const currentBlock=acc[acc.length-1] ;

    // begin => new block if block is not new
    // end => new block in case next begin missing
    if (el==='begin') {
      if (Object.keys(currentBlock).length) 
        acc.push({});
      return acc
    }
    if (el==='end') {
      if (arr.length>idx+1 && newBlockInCaseOfMissingBegin) 
        acc.push({});
      return acc
    }

    const keyword = el[0];
    // repeated function or type declaration => new block (continue to populate it)
    if (keyword==='function'|| keyword==='type') {
      if (currentBlock[keyword]) 
        acc.push({});
      // content is currently the only valid content for type or function
      // need to change this to accept eg name of function
      currentBlock[keyword] = el[1].content || '';
      // types and functions define the block
      currentBlock['is']=keyword;
      return acc
    }

    
    if (keyword==='return' || keyword==='returns') {
      if (!currentBlock.is==='function')
        console.log('Found return without function', currentBlock);
      currentBlock.returns = el[1].type ? `${el[1].type}: ${el[1].content}` : `${el[1].content}` ;      
      return acc
    }

    if (keyword==='param') {
      if (!currentBlock.params)
        currentBlock.params = [];
      currentBlock.params.push( el[1].type ? `${el[1].type}: ${el[1].content}` : `${el[1].content}` );
      return acc
    }

    console.log('something got missed:', el);
    return acc

  }, [{}]);

  return blocks

}

const blockToMarkdown = block => {
  // eg:
  // #### _function_ wrapNativeCurrency 
  // ##### (_(string)_ opts.amount, _(string)_ opts.amount, )
  let markdown='';
  if (block.is==='function') {
    const params = '#####' + block.params
      .map (paramStr=> {
        const [name, type] = paramStr.split(': ').reverse();
        let mdParam = '';
        if (type)
          mdParam += `_(${type})_ ` ;
        if (name)
          mdParam += name ;
        return mdParam
      })
      .join(', ')
    return `#### ${ block.name || block.function.name || block.function }${ 
      (block.params || block.returns) 
        ? `\n ${block.params ? params : `` } ${ block.returns ? ` -> ${block.returns}` : `` }`
        : ``        
      }`

  } else if (block.is==='type') {
    // types are similar
  } else {
    // shouldn't reach here
    console.log("shouldn't reach here");
  }
  // shouldn't reach here
  return markdown
}

const blockToTextLines = block => {
  

}


const isGoodJsDoc =  (whitelist) => {
  return blocksOrMaybeLines=>
    !whitelist 
    || false
  
}

const grabInterestingLines = doc=> {

}

args
  .filter(isFilename)
  .forEach(file=>{
    const content = fs.readFileSync(file).toString();
    console.log( 
      linesToBlocks(jsDocToLines(content))   
      .map(blockToMarkdown)
      .map(markdown=> markdown+'\n\n')
      .join('\n')
    );
    // content
    //   .map(grabInterestingLines)
    //   .filter(isGoodJsDoc)
  })




