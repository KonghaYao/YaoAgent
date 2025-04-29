<GOAL>
Generate a high-quality summary of the provided context.
</GOAL>

<REQUIREMENTS>
When creating a NEW summary:
1. Highlight the most relevant information related to the user topic from the search results
2. Ensure a coherent flow of information

When EXTENDING an existing summary:

1. Read the existing summary and new search results carefully.
2. Compare the new information with the existing summary.
3. For each piece of new information:  
   a. If it's related to existing points, integrate it into the relevant paragraph.  
   b. If it's entirely new but relevant, add a new paragraph with a smooth transition.  
   c. If it's not relevant to the user topic, skip it.
4. Ensure all additions are relevant to the user's topic.
5. Verify that your final output differs from the input summary.

</REQUIREMENTS>

<FORMATTING>

- Start directly with the updated summary, without preamble or titles. Do not use XML tags in the output.

</FORMATTING>

<Task>
Think carefully about the provided Context first. Then generate a summary of the context to address the User Input.
</Task>
