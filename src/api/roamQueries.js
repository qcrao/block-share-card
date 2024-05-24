export const queryNonCodeBlocks = `[:find (count ?s) . :with ?e  :where [?e :block/string ?s]  
					(not (or [(clojure.string/starts-with? ?s "${String.fromCharCode(
            96,
            96,
            96
          )}")] 
									 [(clojure.string/starts-with? ?s "{{")]
 	 								 [(clojure.string/starts-with? ?s "<%")]
									 [(clojure.string/starts-with? ?s"> ")]
									 [(clojure.string/starts-with? ?s"[[>]] ")]										 
  								 [(clojure.string/starts-with? ?s ":q ")]))]`;

export const queryMinDate =
  "[:find (min ?date) . :where [?e :node/title ?name] [?e :create/time ?date] ]";
